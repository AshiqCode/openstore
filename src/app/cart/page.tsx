'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StoreNav } from '@/components/StoreNav';
import { FullPageSpinner } from '@/components/Spinner';
import { StoreUnavailable } from '@/components/StoreUnavailable';
import { useConfigGuard } from '@/lib/useConfigGuard';
import { getSettings } from '@/lib/store';
import { getCart, setQty, removeFromCart, cartSubtotal, onCartChange } from '@/lib/cart';
import { money } from '@/lib/format';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { DEFAULT_SETTINGS, type OrderItem, type Settings } from '@/lib/types';
import { useT } from '@/components/LanguageProvider';

export default function CartPage() {
  const guard = useConfigGuard();
  const S = useT();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (guard !== 'ready') return;
    getSettings().then(setSettings);
    setItems(getCart());
    setReady(true);
    return onCartChange(() => setItems(getCart()));
  }, [guard]);

  if (guard === 'unconfigured') return <StoreUnavailable />;
  if (guard !== 'ready' || !ready) return <FullPageSpinner />;

  const subtotal = cartSubtotal();
  const freeOver = Number(settings.free_delivery_over || 0);
  const baseDelivery = Number(settings.delivery_charges || 0);
  const qualifiesFree = freeOver > 0 && subtotal >= freeOver;
  const delivery = items.length && !qualifiesFree ? baseDelivery : 0;
  const total = subtotal + delivery;
  const awayFromFree = freeOver > 0 && subtotal < freeOver ? freeOver - subtotal : 0;

  return (
    <div className="min-h-screen">
      <StoreNav settings={settings} />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="mb-4 text-2xl font-bold">{S.cart}</h1>

        {items.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-muted">{S.cartEmpty}</p>
            <Link href="/" className="btn btn-primary mt-4">
              {S.continueShopping}
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {items.map((it) => (
                <div key={it.id} className="card flex items-center gap-3 p-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-theme border border-line bg-bg">
                    {it.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.image_url} alt={it.name} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{it.name}</div>
                    <div className="text-sm text-muted">{money(it.price, settings.currency)}</div>
                  </div>
                  <div className="flex items-center overflow-hidden rounded-full border border-line">
                    <button
                      className="flex h-9 w-9 items-center justify-center text-ink hover:bg-bg active:scale-95"
                      aria-label="Decrease quantity"
                      onClick={() => setQty(it.id, it.qty - 1)}
                    >
                      <Minus size={16} strokeWidth={2.5} />
                    </button>
                    <span className="w-8 text-center text-sm font-bold">{it.qty}</span>
                    <button
                      className="flex h-9 w-9 items-center justify-center text-[color:var(--color-primary-fg)] active:scale-95"
                      style={{ background: 'var(--color-primary)' }}
                      aria-label="Increase quantity"
                      onClick={() => setQty(it.id, it.qty + 1)}
                    >
                      <Plus size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                  <div className="w-20 text-right font-semibold">
                    {money(it.price * it.qty, settings.currency)}
                  </div>
                  <button
                    className="ml-1 text-muted hover:text-red-600"
                    aria-label={S.delete}
                    onClick={() => removeFromCart(it.id)}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
            </div>

            {freeOver > 0 && (
              <div
                className="mt-4 rounded-theme border p-3 text-center text-sm"
                style={{
                  borderColor: 'var(--color-border)',
                  background: 'color-mix(in srgb, var(--color-primary) 7%, transparent)',
                }}
              >
                {qualifiesFree ? (
                  <span className="font-medium text-green-600">🎉 You&apos;ve got free delivery!</span>
                ) : (
                  <span>
                    Add <b>{money(awayFromFree, settings.currency)}</b> more for free delivery
                  </span>
                )}
              </div>
            )}

            <div className="card mt-4 p-4">
              <Row label={S.subtotal} value={money(subtotal, settings.currency)} />
              <Row
                label={S.delivery}
                value={qualifiesFree ? 'Free' : money(delivery, settings.currency)}
              />
              <div className="my-2 border-t border-line" />
              <Row label={S.total} value={money(total, settings.currency)} bold />
              <Link href="/checkout" className="btn btn-primary mt-4 w-full">
                {S.checkout}
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-1 ${bold ? 'text-lg font-bold' : ''}`}>
      <span className={bold ? '' : 'text-muted'}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
