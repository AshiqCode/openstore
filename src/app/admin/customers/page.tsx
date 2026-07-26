'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { Spinner } from '@/components/Spinner';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/Confirm';
import { shortDate } from '@/lib/format';
import {
  getCustomersForAdmin,
  deleteCustomerAsAdmin,
  type AdminCustomer,
} from '@/lib/customersAdmin';
import { Users, Trash2, Mail, Phone, Search, Lock, AlertTriangle, ExternalLink } from 'lucide-react';
import { CopyButton } from '@/components/CopyButton';
import { Pagination } from '@/components/Pagination';
import { usePagination } from '@/lib/usePagination';
import { SETUP_SQL } from '@/lib/setupSql';

export default function CustomersPage() {
  return (
    <AdminShell>
      <Customers />
    </AdminShell>
  );
}

function Customers() {
  const toast = useToast();
  const confirm = useConfirm();
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [problem, setProblem] = useState<'setup_required' | 'error' | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await getCustomersForAdmin();
    setCustomers(res.customers);
    setProblem(res.problem);
    setLoading(false);
  }

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      [c.name, c.email, c.phone].some((v) => (v || '').toLowerCase().includes(q))
    );
  }, [customers, query]);

  // Search filters the whole list; pagination only chunks what's rendered.
  const paged = usePagination(shown, 10);

  useEffect(() => {
    paged.setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function remove(c: AdminCustomer) {
    const label = c.name || c.email;

    // A shopper with an order still in flight must not disappear — the seller
    // still has to deliver it. Same rule the database enforces.
    if (c.orders_active > 0) {
      await confirm({
        title: 'Cannot delete this customer',
        message: `${label} has ${c.orders_active} order${c.orders_active === 1 ? '' : 's'} that is still pending or confirmed. Deliver or cancel ${c.orders_active === 1 ? 'it' : 'them'} first, then this account can be removed.`,
        confirmLabel: 'Got it',
        cancelLabel: 'Close',
      });
      return;
    }

    const ok = await confirm({
      title: `Delete ${label}?`,
      message:
        'Their account, saved cart and favorites are removed permanently. Past orders are kept in your Orders list, so your sales history stays intact.',
      confirmLabel: 'Delete account',
      cancelLabel: 'Cancel',
      danger: true,
    });
    if (!ok) return;

    setBusyId(c.id);
    const result = await deleteCustomerAsAdmin(c.id);
    setBusyId(null);

    if (result === 'ok') {
      setCustomers((list) => list.filter((x) => x.id !== c.id));
      toast('Customer deleted', 'success');
      return;
    }
    if (result === 'has_active_orders') {
      // The list was stale — a new order landed since the page loaded.
      toast('That customer now has an active order, so they can no longer be deleted.', 'error');
      void load();
      return;
    }
    toast(result === 'not_found' ? 'That customer no longer exists.' : 'Could not delete', 'error');
  }

  return (
    <div className="animate-fade-up pb-10">
      <h1 className="page-title mb-1 flex items-center gap-2">
        <Users size={22} className="text-primary" /> Customers
      </h1>
      <p className="mb-4 text-sm text-muted">
        Shopper accounts. An account can only be deleted once it has no pending or confirmed orders.
      </p>

      <div className="relative mb-4">
        <Search size={16} className="pointer-events-none absolute left-3 top-3.5 text-muted" />
        <input
          className="input pl-9"
          placeholder="Search by name, email or phone"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted">
          <Spinner size={18} /> Loading…
        </div>
      ) : problem === 'setup_required' ? (
        // An empty list here would be a lie — the database simply doesn't have
        // the customer functions yet. Give the fix right where the problem is.
        <div className="card p-6">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0 text-amber-600">
              <AlertTriangle size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold">One database update needed</h2>
              <p className="mt-1 text-sm text-muted">
                Customer management needs two functions your database doesn&apos;t have yet. Copy the
                setup SQL and run it once in Supabase — it is safe to re-run and changes no existing
                data — then reload this page.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <CopyButton
                  text={SETUP_SQL}
                  label="Copy setup SQL"
                  className="btn btn-primary btn-sm"
                />
                <a
                  href="https://supabase.com/dashboard/project/_/sql/new"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline btn-sm inline-flex items-center gap-1.5"
                >
                  Open SQL Editor <ExternalLink size={14} />
                </a>
                <button className="btn btn-outline btn-sm" onClick={() => void load()}>
                  Reload
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : problem === 'error' ? (
        <div className="card p-6 text-center">
          <p className="font-medium">Could not load customers</p>
          <p className="mt-1 text-sm text-muted">
            Check your connection, then try again.
          </p>
          <button className="btn btn-outline btn-sm mt-3" onClick={() => void load()}>
            Retry
          </button>
        </div>
      ) : shown.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-bg text-muted">
            <Users size={22} />
          </div>
          <p className="font-medium">{customers.length === 0 ? 'No customers yet' : 'No matches'}</p>
          <p className="mt-1 text-sm text-muted">
            {customers.length === 0
              ? 'Accounts appear here when shoppers sign up.'
              : 'Try a different search.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {paged.pageItems.map((c) => {
            const locked = c.orders_active > 0;
            return (
              <div key={c.id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{c.name || 'Customer'}</span>
                      {locked && (
                        <span
                          className="badge"
                          style={{ background: 'rgba(245,158,11,0.15)', color: '#b45309' }}
                        >
                          <Lock size={12} /> {c.orders_active} active order
                          {c.orders_active === 1 ? '' : 's'}
                        </span>
                      )}
                    </div>
                    <a
                      href={`mailto:${c.email}`}
                      className="mt-0.5 flex items-center gap-1.5 text-sm text-primary"
                    >
                      <Mail size={14} /> {c.email}
                    </a>
                    {c.phone && (
                      <a
                        href={`tel:${c.phone}`}
                        className="flex items-center gap-1.5 text-sm text-primary"
                      >
                        <Phone size={14} /> {c.phone}
                      </a>
                    )}
                    <div className="mt-1 text-xs text-muted">Joined {shortDate(c.created_at)}</div>
                  </div>

                  <div className="text-right text-xs text-muted">
                    <div>
                      <b className="text-ink">{c.orders_total}</b> order
                      {c.orders_total === 1 ? '' : 's'}
                    </div>
                    <div>{c.orders_delivered} delivered</div>
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    className="btn btn-outline btn-sm inline-flex items-center gap-1.5"
                    style={locked ? undefined : { color: '#dc2626', borderColor: 'rgba(220,38,38,0.4)' }}
                    onClick={() => remove(c)}
                    disabled={busyId === c.id}
                    title={
                      locked ? 'Has orders that are still pending or confirmed' : 'Delete this account'
                    }
                  >
                    {busyId === c.id ? <Spinner size={15} /> : <Trash2 size={15} />} Delete
                  </button>
                </div>
              </div>
            );
          })}

          <Pagination
            page={paged.page}
            totalPages={paged.totalPages}
            total={paged.total}
            start={paged.start}
            shown={paged.pageItems.length}
            onChange={paged.setPage}
            label="customers"
          />
        </div>
      )}
    </div>
  );
}
