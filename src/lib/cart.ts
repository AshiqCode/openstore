// Cart lives in localStorage as [{id, name, price, qty}].
// A tiny pub/sub lets the navbar badge update when items change.

import type { OrderItem } from './types';

export type CartSnapshot = OrderItem[];

const CART_KEY = 'cart';
type Listener = () => void;
const listeners = new Set<Listener>();

export function getCart(): OrderItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OrderItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: OrderItem[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  listeners.forEach((fn) => fn());
}

export function addToCart(item: Omit<OrderItem, 'qty'>, qty = 1): void {
  const items = getCart();
  const existing = items.find((i) => i.id === item.id);
  if (existing) {
    existing.qty += qty;
  } else {
    items.push({ ...item, qty });
  }
  write(items);
}

export function setQty(id: string, qty: number): void {
  let items = getCart();
  if (qty <= 0) {
    items = items.filter((i) => i.id !== id);
  } else {
    const item = items.find((i) => i.id === id);
    if (item) item.qty = qty;
  }
  write(items);
}

export function removeFromCart(id: string): void {
  write(getCart().filter((i) => i.id !== id));
}

export function clearCart(): void {
  write([]);
}

// Overwrite the whole cart (used when restoring from a customer's DB record).
export function replaceCart(items: OrderItem[]): void {
  write(Array.isArray(items) ? items : []);
}

export function cartCount(): number {
  return getCart().reduce((n, i) => n + i.qty, 0);
}

export function cartSubtotal(): number {
  return getCart().reduce((sum, i) => sum + i.price * i.qty, 0);
}

// Subscribe to cart changes (returns an unsubscribe fn). Also listens to the
// storage event so other tabs stay in sync.
export function onCartChange(fn: Listener): () => void {
  listeners.add(fn);
  const onStorage = (e: StorageEvent) => {
    if (e.key === CART_KEY) fn();
  };
  if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(fn);
    if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage);
  };
}
