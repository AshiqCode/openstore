'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { Spinner } from '@/components/Spinner';
import { useToast } from '@/components/Toast';
import { getOrders, getSettings, updateOrderStatus } from '@/lib/store';
import { money, shortDate, buildOrderMessage, waLink } from '@/lib/format';
import { MapPin, MessageCircle, Package } from 'lucide-react';
import {
  DEFAULT_SETTINGS,
  type Order,
  type OrderStatus,
  type Settings,
} from '@/lib/types';
import { useT } from '@/components/LanguageProvider';

const STATUSES: OrderStatus[] = ['pending', 'confirmed', 'delivered', 'cancelled'];
const FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'delivered', label: 'Delivered' },
];

export default function OrdersPage() {
  return (
    <AdminShell>
      <Orders />
    </AdminShell>
  );
}

function Orders() {
  const toast = useToast();
  const S = useT();
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    Promise.all([getOrders(), getSettings()]).then(([o, s]) => {
      setOrders(o);
      setSettings(s);
      setLoading(false);
    });
  }, []);

  const shown = useMemo(
    () => (filter === 'all' ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter]
  );

  async function changeStatus(o: Order, status: OrderStatus) {
    setOrders((list) => list.map((x) => (x.id === o.id ? { ...x, status } : x)));
    const ok = await updateOrderStatus(o.id, status);
    if (!ok) toast(S.errSaveFailed, 'error');
  }

  function whatsapp(o: Order) {
    const msg = buildOrderMessage({
      storeName: settings.store_name,
      items: o.items || [],
      deliveryCharges: Number(settings.delivery_charges || 0),
      total: Number(o.total),
      name: o.customer_name,
      phone: o.phone,
      address: o.address,
      currency: settings.currency,
      orderId: o.id,
    });
    const link = waLink(o.phone, msg);
    if (link) window.open(link, '_blank');
    else toast('No valid phone number on this order.', 'error');
  }

  return (
    <div className="animate-fade-up">
      <h1 className="page-title mb-4">{S.orders}</h1>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`chip ${filter === f.key ? 'chip-active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card p-4">
              <div className="skeleton h-4 w-1/3" />
              <div className="skeleton mt-2 h-3 w-1/4" />
              <div className="skeleton mt-4 h-16 w-full" />
            </div>
          ))}
        </div>
      ) : shown.length === 0 ? (
        <div className="card flex flex-col items-center p-12 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-bg text-muted">
            <Package size={24} />
          </div>
          <p className="font-medium">No orders here</p>
          <p className="mt-1 text-sm text-muted">New orders will show up on this page.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {shown.map((o) => (
            <div key={o.id} className="card p-4 transition hover:shadow-md">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{o.customer_name || 'Customer'}</span>
                    <StatusBadge status={o.status} />
                  </div>
                  <a href={`tel:${o.phone}`} className="text-sm text-primary">
                    {o.phone}
                  </a>
                  <div className="text-xs text-muted">{shortDate(o.created_at)}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{money(Number(o.total), settings.currency)}</div>
                  <div className="font-mono text-xs text-muted">#{o.id.slice(0, 8)}</div>
                </div>
              </div>

              {o.address && (
                <div className="mt-2 flex items-start gap-1.5 text-sm text-muted">
                  <MapPin size={15} className="mt-0.5 shrink-0" /> {o.address}
                </div>
              )}

              <div className="mt-3 rounded-theme border border-line bg-bg p-2 text-sm">
                {(o.items || []).map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>
                      {it.name} × {it.qty}
                    </span>
                    <span>{money(it.price * it.qty, settings.currency)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <select
                  className="input w-auto py-1.5 text-sm capitalize"
                  value={o.status}
                  onChange={(e) => changeStatus(o, e.target.value as OrderStatus)}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button
                  className="btn btn-outline btn-sm inline-flex items-center gap-1.5"
                  onClick={() => whatsapp(o)}
                >
                  <MessageCircle size={15} /> WhatsApp
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const STATUS_STYLES: Record<OrderStatus, { bg: string; color: string; label: string }> = {
  pending: { bg: 'rgba(245,158,11,0.15)', color: '#b45309', label: 'Pending' },
  confirmed: { bg: 'rgba(37,99,235,0.15)', color: '#1d4ed8', label: 'Confirmed' },
  delivered: { bg: 'rgba(22,163,74,0.15)', color: '#15803d', label: 'Delivered' },
  cancelled: { bg: 'rgba(220,38,38,0.15)', color: '#b91c1c', label: 'Cancelled' },
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
  return (
    <span className="badge" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}
