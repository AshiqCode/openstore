'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StoreNav } from '@/components/StoreNav';
import { FullPageSpinner } from '@/components/Spinner';
import { StoreUnavailable } from '@/components/StoreUnavailable';
import { useConfigGuard } from '@/lib/useConfigGuard';
import { createOrder, getSettings } from '@/lib/store';
import { getCart, cartSubtotal, clearCart } from '@/lib/cart';
import { money, buildOrderMessage, waLink } from '@/lib/format';
import { useToast } from '@/components/Toast';
import { CheckCircle2, LogIn } from 'lucide-react';
import { DEFAULT_SETTINGS, type OrderItem, type Settings } from '@/lib/types';
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

  useEffect(() => {
    if (guard !== 'ready') return;
    getSettings().then(setSettings);
    setItems(getCart());
    setReady(true);
  }, [guard]);

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

    setSubmitting(true);
    const id = await createOrder({
      customer_name: name.trim(),
      customer_email: (customer?.email ?? '').toLowerCase(),
      phone: phone.trim(),
      address: address.trim(),
      items,
      total,
    });
    setSubmitting(false);

    if (!id) {
      toast(S.errSaveFailed, 'error');
      return;
    }

    // Remember the shopper's details for next time.
    void updateCustomerProfile({ name: name.trim(), phone: phone.trim(), address: address.trim() });

    // Order saved. Open WhatsApp if a number is configured.
    const message = buildOrderMessage({
      storeName: settings.store_name,
      items,
      deliveryCharges: delivery,
      total,
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      currency: settings.currency,
      orderId: id,
    });
    const link = waLink(settings.whatsapp_number, message);
    clearCart();
    setDoneId(id);
    if (link) window.open(link, '_blank');
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
            <h1 className="text-xl font-bold">{S.orderReceived}</h1>
            <p className="mt-2 text-muted">
              Order ID: <span className="font-mono font-semibold">{doneId.slice(0, 8)}</span>
            </p>
            {settings.whatsapp_number ? (
              <p className="mt-2 text-sm text-muted">{S.whatsappOpened}</p>
            ) : null}
            <Link href={`/track?id=${doneId.slice(0, 8)}`} className="btn btn-primary mt-6 w-full">
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
          <div className="grid gap-6 md:grid-cols-2">
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
              {storeClosed && (
                <p className="rounded-theme bg-amber-50 p-2 text-sm text-amber-700">
                  🛑 The store is closed right now — ordering is paused.
                </p>
              )}
              <button className="btn btn-primary mt-2" disabled={submitting || storeClosed}>
                {submitting ? S.saving : S.placeOrder}
              </button>
            </form>

            <div className="card h-fit p-4">
              <h2 className="mb-3 font-semibold">{S.orderSummary}</h2>
              {items.map((it) => (
                <div key={it.id} className="flex justify-between py-1 text-sm">
                  <span className="min-w-0 truncate">
                    {it.name} × {it.qty}
                  </span>
                  <span className="ml-2 shrink-0">{money(it.price * it.qty, settings.currency)}</span>
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
