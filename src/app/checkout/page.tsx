'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StoreNav } from '@/components/StoreNav';
import { FullPageSpinner, Spinner } from '@/components/Spinner';
import { StoreUnavailable } from '@/components/StoreUnavailable';
import { useConfigGuard } from '@/lib/useConfigGuard';
import { createOrder, getSettings } from '@/lib/store';
import { getCart, cartSubtotal, clearCart } from '@/lib/cart';
import { money } from '@/lib/format';
import { payForOrder } from '@/lib/pay';
import { useToast } from '@/components/Toast';
import { CheckCircle2, LogIn, Banknote, CreditCard } from 'lucide-react';
import {
  DEFAULT_SETTINGS,
  type OrderItem,
  type PaymentMethod,
  type Settings,
} from '@/lib/types';
import { useT } from '@/components/LanguageProvider';
import { useCustomer } from '@/components/CustomerProvider';
import { updateCustomerProfile } from '@/lib/customer';

export default function CheckoutPage() {
  const guard = useConfigGuard();
  const toast = useToast();
  const S = useT();
  const customer = useCustomer();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [ready, setReady] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [doneId, setDoneId] = useState<string | null>(null);
  const [payment, setPayment] = useState<PaymentMethod>('cod');
  const [cardEnabled, setCardEnabled] = useState(false);
  const [paidByCard, setPaidByCard] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (guard !== 'ready') return;
    getSettings().then(setSettings);
    setItems(getCart());
    setReady(true);
  }, [guard]);

  // Card payments only appear if the deployment actually has a Stripe key.
  useEffect(() => {
    fetch('/api/checkout/')
      .then((r) => (r.ok ? r.json() : { enabled: false }))
      .then((d) => setCardEnabled(!!d.enabled))
      .catch(() => setCardEnabled(false));
  }, []);

  // Handle the return trip from Stripe. Read from window rather than
  // useSearchParams so the page doesn't need a Suspense boundary.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paid = params.get('paid');
    const sessionId = params.get('session_id');
    if (paid) {
      clearCart();
      setItems([]);
      setPaidByCard(true);
      setDoneId(paid);
      window.history.replaceState({}, '', '/checkout/');

      // Ask our server to verify the payment with Stripe and record it. The
      // webhook does this too; whichever gets there first wins.
      if (sessionId) {
        setConfirming(true);
        fetch('/api/checkout/confirm/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: paid, sessionId }),
        })
          .then((r) => r.json().catch(() => ({})))
          .then((d) => setConfirmed(!!d.paid && d.recorded !== false))
          .catch(() => setConfirmed(false))
          .finally(() => setConfirming(false));
      }
      return;
    }
    if (params.get('canceled')) {
      toast('Payment canceled — your cart is still here.', 'error');
      window.history.replaceState({}, '', '/checkout/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prefill from the logged-in shopper's saved profile.
  useEffect(() => {
    if (customer) {
      setName((n) => n || customer.name);
      setPhone((p) => p || customer.phone);
      setAddress((a) => a || customer.address);
    }
  }, [customer]);

  if (guard === 'unconfigured') return <StoreUnavailable />;
  if (guard !== 'ready' || !ready) return <FullPageSpinner />;

  // Login is required to place an order (keeps the cart + profile safe).
  if (!customer) {
    return (
      <div className="min-h-screen">
        <StoreNav settings={settings} />
        <main className="mx-auto max-w-md px-4 py-16">
          <div className="card flex flex-col items-center p-8 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-bg text-primary">
              <LogIn size={26} />
            </div>
            <h1 className="text-xl font-bold">Please log in to checkout</h1>
            <p className="mt-1 text-sm text-muted">
              Create a free account so your cart and orders stay saved — even if you clear your browser.
            </p>
            <Link href="/account?redirect=/checkout" className="btn btn-primary mt-5 w-full">
              Log in / Sign up
            </Link>
            <Link href="/cart" className="btn btn-outline mt-2 w-full">
              Back to cart
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const subtotal = cartSubtotal();
  const freeOver = Number(settings.free_delivery_over || 0);
  const baseDelivery = Number(settings.delivery_charges || 0);
  const qualifiesFree = freeOver > 0 && subtotal >= freeOver;
  const delivery = items.length && !qualifiesFree ? baseDelivery : 0;
  const total = subtotal + delivery;
  const storeClosed = settings.store_open === 'false';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (storeClosed) {
      toast('The store is currently closed — ordering is paused.', 'error');
      return;
    }
    if (!name.trim() || !phone.trim() || !address.trim()) {
      toast(S.fillAllFields, 'error');
      return;
    }
    if (items.length === 0) return;

    const method: PaymentMethod = cardEnabled ? payment : 'cod';

    setSubmitting(true);
    const created = await createOrder({
      customer_name: name.trim(),
      customer_email: (customer?.email ?? '').toLowerCase(),
      phone: phone.trim(),
      address: address.trim(),
      items,
      total,
      payment_method: method,
    });

    const id = created.id;
    if (!id) {
      setSubmitting(false);
      toast(
        created.needsMigration
          ? 'Card payments are not ready on this store yet. Please choose Cash on delivery.'
          : S.errSaveFailed,
        'error'
      );
      // Let them switch instead of hitting the same wall again.
      if (created.needsMigration) setPayment('cod');
      return;
    }

    // Remember the shopper's details for next time.
    void updateCustomerProfile({ name: name.trim(), phone: phone.trim(), address: address.trim() });

    // Card: hand off to Stripe. The cart is deliberately NOT cleared yet — if
    // they abandon the payment page they come back to an intact cart, and the
    // order stays payable from Track & order history.
    if (method === 'card') {
      const res = await payForOrder(id, items, (customer?.email ?? '').toLowerCase());
      if (!res.ok) {
        setSubmitting(false);
        toast(res.error || 'Could not start the payment.', 'error');
      }
      return;
    }

    setSubmitting(false);

    // Cash on delivery: the order is already saved to the database, which is
    // all the seller needs. WhatsApp is only used for tracking an order, never
    // for placing one.
    clearCart();
    setDoneId(id);
  }

  if (doneId) {
    return (
      <div className="min-h-screen">
        <StoreNav settings={settings} />
        <main className="mx-auto max-w-md px-4 py-16 text-center">
          <div className="card p-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle2 size={32} />
            </div>
            <h1 className="text-xl font-bold">
              {paidByCard ? 'Payment successful' : S.orderReceived}
            </h1>
            <p className="mt-2 text-muted">
              Order ID: <span className="font-mono font-semibold">{doneId.slice(0, 8)}</span>
            </p>
            {paidByCard ? (
              confirming ? (
                <p className="mt-2 flex items-center justify-center gap-2 text-sm text-muted">
                  <Spinner size={15} /> Confirming your payment…
                </p>
              ) : confirmed ? (
                <p className="mt-2 text-sm text-muted">
                  Thanks! Your card payment went through and the seller has your order.
                </p>
              ) : (
                <p className="mt-2 text-sm text-muted">
                  Thanks! Your payment is being confirmed — the order updates as soon as it clears.
                </p>
              )
            ) : (
              <p className="mt-2 text-sm text-muted">
                The seller has your order and will contact you to arrange delivery. Pay cash when it
                arrives.
              </p>
            )}
            <Link href={`/track/?id=${doneId.slice(0, 8)}`} className="btn btn-primary mt-6 w-full">
              Track this order
            </Link>
            <Link href="/" className="btn btn-outline mt-2 w-full">
              {S.continueShopping}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <StoreNav settings={settings} />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="mb-4 text-2xl font-bold">{S.checkout}</h1>

        {items.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-muted">{S.cartEmpty}</p>
            <Link href="/" className="btn btn-primary mt-4">
              {S.continueShopping}
            </Link>
          </div>
        ) : (
          <div className="flex flex-col-reverse gap-6 md:grid md:grid-cols-2">
            <form onSubmit={submit} className="card flex flex-col gap-3 p-4">
              <div>
                <label className="label">{S.yourName}</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="label">{S.phone}</label>
                <input
                  className="input"
                  inputMode="tel"
                  placeholder="03xx xxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="label">{S.address}</label>
                <textarea
                  className="input min-h-24"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              {cardEnabled && (
                <div>
                  <label className="label">Payment</label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <PayOption
                      active={payment === 'cod'}
                      onClick={() => setPayment('cod')}
                      icon={<Banknote size={18} />}
                      title="Cash on delivery"
                      sub="Pay the rider when it arrives"
                    />
                    <PayOption
                      active={payment === 'card'}
                      onClick={() => setPayment('card')}
                      icon={<CreditCard size={18} />}
                      title="Pay with card"
                      sub="Secure payment via Stripe"
                    />
                  </div>
                </div>
              )}
              {storeClosed && (
                <p className="rounded-theme bg-amber-50 p-2 text-sm text-amber-700">
                  🛑 The store is closed right now — ordering is paused.
                </p>
              )}
              <button className="btn btn-primary mt-2" disabled={submitting || storeClosed}>
                {submitting
                  ? S.saving
                  : cardEnabled && payment === 'card'
                    ? `Pay ${money(total, settings.currency)}`
                    : S.placeOrder}
              </button>
            </form>

            <div className="card h-fit p-4">
              <h2 className="mb-3 font-semibold">{S.orderSummary}</h2>
              {items.map((it) => (
                <div key={it.id} className="flex items-center gap-3 py-2 text-sm">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-theme border border-line bg-bg">
                    {it.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.image_url} alt={it.name} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-ink">{it.name}</div>
                    <div className="text-xs text-muted">
                      {money(it.price, settings.currency)} × {it.qty}
                    </div>
                  </div>
                  <span className="shrink-0 font-medium">
                    {money(it.price * it.qty, settings.currency)}
                  </span>
                </div>
              ))}
              <div className="my-2 border-t border-line" />
              <div className="flex justify-between py-1 text-sm text-muted">
                <span>{S.delivery}</span>
                <span>{money(delivery, settings.currency)}</span>
              </div>
              <div className="flex justify-between py-1 text-lg font-bold">
                <span>{S.total}</span>
                <span>{money(total, settings.currency)}</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// One selectable payment method. Radio semantics, card-sized tap target.
function PayOption({
  active,
  onClick,
  icon,
  title,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className="flex items-center gap-3 rounded-theme border p-3 text-left transition"
      style={{
        borderColor: active ? 'var(--color-primary)' : 'var(--color-border)',
        background: active
          ? 'color-mix(in srgb, var(--color-primary) 8%, transparent)'
          : 'transparent',
      }}
    >
      <span style={{ color: active ? 'var(--color-primary)' : 'var(--color-muted)' }}>{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted">{sub}</span>
      </span>
    </button>
  );
}
