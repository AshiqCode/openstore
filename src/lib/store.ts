// Data access layer — thin wrappers over Supabase for products, settings, orders.
// Every function is null/empty-safe so pages can render before config exists.

import { getSupabase } from './supabase';
import {
  DEFAULT_SETTINGS,
  type Order,
  type OrderItem,
  type OrderStatus,
  type Product,
  type Settings,
} from './types';

// ---- Settings -------------------------------------------------------------

// Read the whole settings table into a typed object (missing keys → defaults).
export async function getSettings(): Promise<Settings> {
  const supabase = await getSupabase();
  if (!supabase) return { ...DEFAULT_SETTINGS };
  const { data, error } = await supabase.from('settings').select('key, value');
  if (error || !data) return { ...DEFAULT_SETTINGS };

  const out: Settings = { ...DEFAULT_SETTINGS };
  for (const row of data as { key: string; value: string }[]) {
    if (row.key in out) (out as Record<string, string>)[row.key] = row.value ?? '';
  }
  return out;
}

// Upsert one or many settings keys.
export async function saveSettings(
  patch: Partial<Record<keyof Settings, string>>
): Promise<boolean> {
  const supabase = await getSupabase();
  if (!supabase) return false;
  const rows = Object.entries(patch).map(([key, value]) => ({ key, value }));
  const { error } = await supabase.from('settings').upsert(rows, { onConflict: 'key' });
  return !error;
}

// ---- Products -------------------------------------------------------------

// Active products for the public store, ordered for display.
export async function getActiveProducts(): Promise<Product[]> {
  const supabase = await getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data as Product[];
}

// All products for the admin panel (including hidden).
export async function getAllProducts(): Promise<Product[]> {
  const supabase = await getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data as Product[];
}

export async function getProduct(id: string): Promise<Product | null> {
  const supabase = await getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  return data as Product;
}

export type ProductInput = Omit<Product, 'id' | 'created_at'>;

export async function createProduct(input: ProductInput): Promise<boolean> {
  const supabase = await getSupabase();
  if (!supabase) return false;
  const { error } = await supabase.from('products').insert(input);
  return !error;
}

export async function updateProduct(
  id: string,
  patch: Partial<ProductInput>
): Promise<boolean> {
  const supabase = await getSupabase();
  if (!supabase) return false;
  const { error } = await supabase.from('products').update(patch).eq('id', id);
  return !error;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const supabase = await getSupabase();
  if (!supabase) return false;
  const { error } = await supabase.from('products').delete().eq('id', id);
  return !error;
}

// Persist a new order of sort_order values (drag-to-reorder).
export async function reorderProducts(orderedIds: string[]): Promise<boolean> {
  const supabase = await getSupabase();
  if (!supabase) return false;
  // Update sequentially; lists are small for a student store.
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from('products')
      .update({ sort_order: i })
      .eq('id', orderedIds[i]);
    if (error) return false;
  }
  return true;
}

// ---- Image upload ---------------------------------------------------------

// Upload a compressed image blob to the store-images bucket, return public URL.
// `prefix` groups files (e.g. 'products', 'logo'). Returns null on failure.
export async function uploadImage(
  blob: Blob,
  prefix = 'products'
): Promise<string | null> {
  const supabase = await getSupabase();
  if (!supabase) return null;
  // Unique-ish name without Math.random: time + short counter suffix.
  const stamp = new Date().getTime();
  const path = `${prefix}/${stamp}-${uploadCounter++}.jpg`;
  const { error } = await supabase.storage
    .from('store-images')
    .upload(path, blob, { contentType: 'image/jpeg', upsert: true });
  if (error) return null;
  const { data } = supabase.storage.from('store-images').getPublicUrl(path);
  return data.publicUrl ?? null;
}
let uploadCounter = 0;

// ---- Orders ---------------------------------------------------------------

export type NewOrder = {
  customer_name: string;
  customer_email: string;
  phone: string;
  address: string;
  items: OrderItem[];
  total: number;
};

// A logged-in shopper's full order history, newest first. Looked up by their
// customer id (a random UUID they only obtain by logging in) through a
// SECURITY DEFINER RPC — the orders table itself is NOT readable with the
// public anon key, so no one can bulk-read other people's orders.
export async function getOrdersForCustomer(customerId: string): Promise<Order[]> {
  const supabase = await getSupabase();
  if (!supabase || !customerId) return [];
  const { data, error } = await supabase.rpc('orders_for_customer', {
    p_customer_id: customerId,
  });
  if (error || !data) return [];
  return data as Order[];
}

// A random order id, generated on the client so we don't need to read the row
// back after insert (the public key can insert orders but not SELECT them).
// Uses crypto.randomUUID in secure contexts, with a fallback for plain-http
// LAN testing where it may be unavailable.
function newOrderId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through to the manual generator */
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Creates an order (anyone may place one). We set the id ourselves and don't
// read the row back, since RLS lets the public insert orders but not read them.
// Returns the id (its first 8 chars are the code shown to the customer).
export async function createOrder(order: NewOrder): Promise<string | null> {
  const supabase = await getSupabase();
  if (!supabase) return null;
  const id = newOrderId();
  const { error } = await supabase
    .from('orders')
    .insert({ id, ...order, status: 'pending' });
  if (error) return null;
  return id;
}

// Look up a single order for customer order-tracking, by the full id or the
// short 8-char code shown at checkout. Goes through a SECURITY DEFINER RPC so a
// shopper can find THEIR order by its (unguessable) code, without the orders
// table being readable in bulk with the public anon key.
export async function getOrderByCode(code: string): Promise<Order | null> {
  const supabase = await getSupabase();
  if (!supabase) return null;
  const c = code.trim();
  if (!c) return null;
  const { data, error } = await supabase.rpc('order_lookup', { p_code: c });
  if (error || !data || !(data as Order[]).length) return null;
  return (data as Order[])[0];
}

export async function getOrders(): Promise<Order[]> {
  const supabase = await getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data as Order[];
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<boolean> {
  const supabase = await getSupabase();
  if (!supabase) return false;
  const { error } = await supabase.from('orders').update({ status }).eq('id', id);
  return !error;
}

// True if the product appears in any order that is still pending or confirmed.
// Such products must not be deletable (the order history would break).
export async function productInActiveOrders(productId: string): Promise<boolean> {
  const supabase = await getSupabase();
  if (!supabase) return false;
  const { data, error } = await supabase
    .from('orders')
    .select('items, status')
    .in('status', ['pending', 'confirmed']);
  if (error || !data) return false;
  return (data as { items: OrderItem[] }[]).some(
    (o) => Array.isArray(o.items) && o.items.some((it) => it.id === productId)
  );
}
