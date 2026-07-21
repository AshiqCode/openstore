// Customer (shopper) accounts — stored in the DB (see supabase/setup.sql).
//
// Login/signup use bcrypt via SECURITY DEFINER RPC functions (no email/SMTP).
// The shopper's profile, cart and favorites live in the `customers` table, so
// clearing the browser doesn't lose anything — logging back in restores it.
//
// localStorage only holds a lightweight session pointer, NOT the durable data.

import { getSupabase } from './supabase';
import { getCart, replaceCart, type CartSnapshot } from './cart';
import { getFavorites, replaceFavorites } from './favorites';

export type Customer = {
  id: string;
  email: string;
  name: string;
  phone: string;
  address: string;
};

export type CustomerResult = { ok: boolean; error?: string; customer?: Customer };

const SESSION_KEY = 'customer_session';
type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((fn) => fn());
}

export function onCustomerChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getCustomer(): Customer | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Customer) : null;
  } catch {
    return null;
  }
}

export function isCustomerLoggedIn(): boolean {
  return getCustomer() !== null;
}

function saveSession(c: Customer) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(c));
  emit();
}

export function signOutCustomer(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(SESSION_KEY);
  replaceCart([]);
  replaceFavorites([]);
  emit();
}

function friendly(message: string): string {
  if (/could not find the function|does not exist|schema cache/i.test(message))
    return 'Setup not complete — re-run the setup SQL in Supabase.';
  return message;
}

export async function signUpCustomer(
  email: string,
  password: string,
  name: string
): Promise<CustomerResult> {
  const supabase = await getSupabase();
  if (!supabase) return { ok: false, error: 'Store not connected.' };
  const { data, error } = await supabase.rpc('customer_signup', {
    p_email: email.trim(),
    p_password: password,
    p_name: name.trim(),
  });
  if (error) return { ok: false, error: friendly(error.message) };
  switch (data) {
    case 'ok':
      return signInCustomer(email, password);
    case 'exists':
      return { ok: false, error: 'This email already has an account. Please log in.' };
    case 'weak_password':
      return { ok: false, error: 'Password must be at least 6 characters.' };
    case 'invalid_email':
      return { ok: false, error: 'Please enter a valid email address.' };
    default:
      return { ok: false, error: 'Could not create account.' };
  }
}

export async function signInCustomer(email: string, password: string): Promise<CustomerResult> {
  const supabase = await getSupabase();
  if (!supabase) return { ok: false, error: 'Store not connected.' };
  const { data, error } = await supabase.rpc('customer_login', {
    p_email: email.trim(),
    p_password: password,
  });
  if (error) return { ok: false, error: friendly(error.message) };
  if (!data) return { ok: false, error: 'Wrong email or password.' };

  const row = data as Customer & { cart: unknown; favorites: unknown };
  const customer: Customer = {
    id: row.id,
    email: row.email,
    name: row.name ?? '',
    phone: row.phone ?? '',
    address: row.address ?? '',
  };

  // Restore the durable cart + favorites from the DB (merge any local cart).
  const dbCart = Array.isArray(row.cart) ? (row.cart as CartSnapshot) : [];
  const dbFavs = Array.isArray(row.favorites) ? (row.favorites as string[]) : [];
  const localCart = getCart();
  const mergedCart = mergeCarts(dbCart, localCart);
  const mergedFavs = Array.from(new Set([...dbFavs, ...getFavorites()]));
  replaceCart(mergedCart);
  replaceFavorites(mergedFavs);

  saveSession(customer);
  // Persist the merged state back so the DB stays the source of truth.
  await syncCustomer(customer.id, mergedCart, mergedFavs);
  return { ok: true, customer };
}

export async function updateCustomerProfile(patch: {
  name: string;
  phone: string;
  address: string;
}): Promise<boolean> {
  const c = getCustomer();
  const supabase = await getSupabase();
  if (!c || !supabase) return false;
  const { error } = await supabase.rpc('customer_update', {
    p_id: c.id,
    p_name: patch.name,
    p_phone: patch.phone,
    p_address: patch.address,
  });
  if (error) return false;
  saveSession({ ...c, ...patch });
  return true;
}

// Push the current cart + favorites to the DB (called on change while logged in).
export async function syncCustomer(
  id: string,
  cart: CartSnapshot,
  favorites: string[]
): Promise<void> {
  const supabase = await getSupabase();
  if (!supabase) return;
  await supabase.rpc('customer_sync', {
    p_id: id,
    p_cart: cart,
    p_favorites: favorites,
  });
}

function mergeCarts(a: CartSnapshot, b: CartSnapshot): CartSnapshot {
  const map = new Map<string, CartSnapshot[number]>();
  [...a, ...b].forEach((it) => {
    const existing = map.get(it.id);
    if (existing) existing.qty = Math.max(existing.qty, it.qty);
    else map.set(it.id, { ...it });
  });
  return Array.from(map.values());
}
