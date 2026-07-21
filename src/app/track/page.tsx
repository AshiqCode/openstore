'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PackageSearch, MessageCircle, LogIn } from 'lucide-react';
import { StoreNav } from '@/components/StoreNav';
import { StoreFooter } from '@/components/StoreFooter';
import { FullPageSpinner, Spinner } from '@/components/Spinner';
import { StoreUnavailable } from '@/components/StoreUnavailable';
import { useConfigGuard } from '@/lib/useConfigGuard';
import { getOrderByCode, getOrdersForCustomer, getSettings } from '@/lib/store';
import { money, shortDate, waLink } from '@/lib/format';
import { useCustomer } from '@/components/CustomerProvider';
import { DEFAULT_SETTINGS, type Order, type OrderStatus, type Settings } from '@/lib/types';

export default function TrackPage() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <TrackInner />
    </Suspense>
  );
}

function TrackInner() {
  const guard = useConfigGuard();
  const customer = useCustomer();
  const params = useSearchParams();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [code, setCode] = useState(params.get('id') ?? '');
  const [found, setFound] = useState<Order | null>(null);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (guard !== 'ready') return;
    getSettings().then(setSettings);
    if (customer) {
      getOrdersForCustomer(customer.email).then((o) => {
        setOrders(o);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
    if (params.get('id')) void lookup(params.get('id') as string);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guard, customer]);

  async function lookup(c: string) {
    setSearching(true);
    setSearched(true);
    setFound(await getOrderByCode(c));
    setSearching(false);
  }

  if (guard === 'unconfigured') return <StoreUnavailable />;
  if (guard !== 'ready') return <FullPageSpinner />;

  return (
    <div className="min-h-screen">
      <StoreNav settings={settings} />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold">
          <PackageSearch size={22} className="text-primary" /> Track & order history
        </h1>
        <p className="mb-5 text-sm text-muted">
          Look up any order by its ID, or see your full history below.
        </p>

        {/* ID lookup */}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (code.trim()) lookup(code);
          }}
        >
          <input
            className="input"
            placeholder="Order ID e.g. a1b2c3d4"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button className="btn btn-primary shrink-0" disabled={searching}>
            {searching ? <Spinner size={18} /> : 'Track'}
          </button>
        </form>

        {searched && !searching && (
          <div className="mt-4">
            {found ? (
              <OrderCard order={found} settings={settings} />
            ) : (
              <div className="card p-5 text-center text-sm text-muted">
                No order found for that ID.
              </div>
            )}
          </div>
        )}

        {/* Order history */}
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-bold">Your orders</h2>
          {!customer ? (
            <div className="card flex flex-col items-center p-8 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-bg text-primary">
                <LogIn size={22} />
              </div>
              <p className="font-medium">Log in to see your order history</p>
              <Link href="/account?redirect=/track" className="btn btn-primary mt-4">
                Log in / Sign up
              </Link>
            </div>
          ) : loading ? (
            <FullPageSpinner />
          ) : orders.length === 0 ? (
            <div className="card p-8 text-center text-sm text-muted">
              You haven&apos;t placed any orders yet.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {orders.map((o) => (
                <OrderCard key={o.id} order={o} settings={settings} />
              ))}
            </div>
          )}
        </div>
      </main>
      <StoreFooter settings={settings} />
    </div>
  );
}

const STATUS_STYLES: Record<OrderStatus, { bg: string; color: string; label: string }> = {
  pending: { bg: 'rgba(245,158,11,0.15)', color: '#b45309', label: 'Pending' },
  confirmed: { bg: 'rgba(37,99,235,0.15)', color: '#1d4ed8', label: 'Confirmed' },
  delivered: { bg: 'rgba(22,163,74,0.15)', color: '#15803d', label: 'Delivered' },
  cancelled: { bg: 'rgba(220,38,38,0.15)', color: '#b91c1c', label: 'Cancelled' },
};

function OrderCard({ order, settings }: { order: Order; settings: Settings }) {
  const s = STATUS_STYLES[order.status] ?? STATUS_STYLES.pending;
  // Only pending / confirmed orders get the "track on WhatsApp" button.
  const canTrack = order.status === 'pending' || order.status === 'confirmed';
  const waMessage = `Assalam o Alaikum! Mera order track karna hai.\nOrder ID: #${order.id.slice(0, 8)}\nStore: ${settings.store_name}`;
  const link = waLink(settings.whatsapp_number, waMessage);

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold">#{order.id.slice(0, 8)}</span>
            <span className="badge" style={{ background: s.bg, color: s.color }}>
              {s.label}
            </span>
          </div>
          <div className="text-xs text-muted">{shortDate(order.created_at)}</div>
        </div>
        <div className="text-lg font-bold">{money(Number(order.total), settings.currency)}</div>
      </div>

      <div className="mt-3 rounded-theme border border-line bg-bg p-2.5 text-sm">
        {(order.items || []).map((it, i) => (
          <div key={i} className="flex justify-between py-0.5">
            <span className="min-w-0 truncate">
              {it.name} × {it.qty}
            </span>
            <span className="ml-2 shrink-0">{money(it.price * it.qty, settings.currency)}</span>
          </div>
        ))}
      </div>

      {canTrack && link && (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="btn btn-outline btn-sm mt-3 inline-flex items-center gap-1.5"
          style={{ color: '#16a34a', borderColor: 'rgba(22,163,74,0.4)' }}
        >
          <MessageCircle size={15} /> Track your order on WhatsApp
        </a>
      )}
    </div>
  );
}
