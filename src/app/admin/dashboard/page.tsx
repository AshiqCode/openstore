'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Settings as SettingsIcon,
  ShoppingBag,
  Clock,
  CalendarDays,
  Wallet,
  ArrowUpRight,
  ExternalLink,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { Spinner } from '@/components/Spinner';
import { getAllProducts, getOrders } from '@/lib/store';
import { money, shortDate } from '@/lib/format';
import { getSettings } from '@/lib/store';
import { useT } from '@/components/LanguageProvider';
import { DEFAULT_SETTINGS, type Order, type Settings } from '@/lib/types';

export default function DashboardPage() {
  return (
    <AdminShell>
      <Dashboard />
    </AdminShell>
  );
}

function Dashboard() {
  const S = useT();
  const [loading, setLoading] = useState(true);
  const [productCount, setProductCount] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    Promise.all([getAllProducts(), getOrders(), getSettings()]).then(([p, o, s]) => {
      setProductCount(p.length);
      setOrders(o);
      setSettings(s);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted">
        <Spinner size={18} /> Loading…
      </div>
    );
  }

  const pending = orders.filter((o) => o.status === 'pending').length;
  const todayKey = new Date().toDateString();
  const today = orders.filter((o) => {
    try {
      return new Date(o.created_at).toDateString() === todayKey;
    } catch {
      return false;
    }
  }).length;
  const revenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + Number(o.total || 0), 0);

  const missing: string[] = [];
  if (!settings.seller_name.trim()) missing.push('your name');
  if (!settings.contact_email.trim()) missing.push('contact email');
  if (!settings.whatsapp_number.trim()) missing.push('WhatsApp number');
  if (!settings.about_text.trim()) missing.push('about text');

  return (
    <div className="animate-fade-up">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="page-title">{S.dashboard}</h1>
        <Link href="/about" target="_blank" className="btn btn-outline btn-sm inline-flex items-center gap-1.5">
          <ExternalLink size={14} /> View public profile
        </Link>
      </div>

      {missing.length > 0 && (
        <div className="mb-4 flex flex-col gap-3 rounded-theme border border-amber-300 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2 text-sm text-amber-800">
            <UserRound size={18} className="mt-0.5 shrink-0" />
            <span>
              <b>Complete your profile</b> — add {missing.join(', ')} so customers can trust and reach you.
            </span>
          </div>
          <Link href="/admin/settings" className="btn btn-primary btn-sm shrink-0">
            Complete now
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Products" value={String(productCount)} href="/admin/products" icon={ShoppingBag} />
        <Stat label="Pending orders" value={String(pending)} href="/admin/orders" icon={Clock} accent />
        <Stat label="Orders today" value={String(today)} href="/admin/orders" icon={CalendarDays} />
        <Stat label="Revenue" value={money(revenue, settings.currency)} icon={Wallet} />
      </div>

      <div className="mt-6 card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Recent orders</h2>
          <Link href="/admin/orders" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </div>
        {orders.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">No orders yet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-line">
            {orders.slice(0, 6).map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-medium">{o.customer_name || 'Customer'}</div>
                  <div className="text-xs text-muted">{shortDate(o.created_at)}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-semibold">{money(Number(o.total), settings.currency)}</div>
                  <div className="text-xs text-muted capitalize">{o.status}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/admin/products" className="btn btn-primary inline-flex items-center gap-1.5">
          <Plus size={16} /> {S.add} {S.products.toLowerCase()}
        </Link>
        <Link href="/admin/settings" className="btn btn-outline inline-flex items-center gap-1.5">
          <SettingsIcon size={16} /> {S.settings}
        </Link>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  href,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  href?: string;
  icon: LucideIcon;
  accent?: boolean;
}) {
  const inner = (
    <div className="card group h-full p-4 transition hover:shadow-md">
      <div className="flex items-start justify-between">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{
            background: accent
              ? 'var(--color-primary)'
              : 'color-mix(in srgb, var(--color-primary) 12%, transparent)',
            color: accent ? 'var(--color-primary-fg)' : 'var(--color-primary)',
          }}
        >
          <Icon size={18} />
        </div>
        {href && (
          <ArrowUpRight size={16} className="text-muted opacity-0 transition group-hover:opacity-100" />
        )}
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight">{value}</div>
      <div className="text-sm text-muted">{label}</div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
