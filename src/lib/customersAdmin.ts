// Admin-only access to shopper accounts.
//
// Kept apart from lib/customer.ts (which is the shopper's own login/profile) so
// the two never get confused: nothing here is reachable without a logged-in
// admin, because both RPCs are granted to `authenticated` alone.

import { getSupabase } from './supabase';

export type AdminCustomer = {
  id: string;
  email: string;
  name: string;
  phone: string;
  address: string;
  created_at: string;
  orders_total: number;
  orders_active: number; // pending or confirmed — these block deletion
  orders_delivered: number;
};

// 'setup_required' means the database doesn't have customers_admin_list yet —
// the store hasn't re-run the setup SQL since customer management was added.
// PostgREST reports an unknown function as PGRST202.
export type CustomersResult = {
  customers: AdminCustomer[];
  problem: 'setup_required' | 'error' | null;
};

export async function getCustomersForAdmin(): Promise<CustomersResult> {
  const supabase = await getSupabase();
  if (!supabase) return { customers: [], problem: 'error' };

  const { data, error } = await supabase.rpc('customers_admin_list');
  if (error) {
    const missing = error.code === 'PGRST202' || /could not find the function/i.test(error.message);
    return { customers: [], problem: missing ? 'setup_required' : 'error' };
  }

  const customers = ((data ?? []) as AdminCustomer[]).map((c) => ({
    ...c,
    orders_total: Number(c.orders_total) || 0,
    orders_active: Number(c.orders_active) || 0,
    orders_delivered: Number(c.orders_delivered) || 0,
  }));
  return { customers, problem: null };
}

export type DeleteCustomerResult = 'ok' | 'not_found' | 'has_active_orders' | 'error';

// The database makes the final call — the UI check is only there to explain
// why the button is disabled before it's pressed.
export async function deleteCustomerAsAdmin(id: string): Promise<DeleteCustomerResult> {
  const supabase = await getSupabase();
  if (!supabase) return 'error';
  const { data, error } = await supabase.rpc('customer_admin_delete', { p_id: id });
  if (error) return 'error';
  const result = String(data ?? '');
  if (result === 'ok' || result === 'not_found' || result === 'has_active_orders') return result;
  return 'error';
}
