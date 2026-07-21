// Wishlist / favorites — stored in localStorage as an array of product ids.
// Small pub/sub so the navbar heart badge updates live (same pattern as cart).

const FAV_KEY = 'favorites';
type Listener = () => void;
const listeners = new Set<Listener>();

export function getFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(FAV_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function write(ids: string[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(FAV_KEY, JSON.stringify(ids));
  listeners.forEach((fn) => fn());
}

export function isFavorite(id: string): boolean {
  return getFavorites().includes(id);
}

export function toggleFavorite(id: string): boolean {
  const ids = getFavorites();
  const has = ids.includes(id);
  write(has ? ids.filter((x) => x !== id) : [...ids, id]);
  return !has;
}

export function favoritesCount(): number {
  return getFavorites().length;
}

// Overwrite the whole list (used when restoring from a customer's DB record).
export function replaceFavorites(ids: string[]): void {
  write(Array.isArray(ids) ? ids.filter((x) => typeof x === 'string') : []);
}

export function onFavoritesChange(fn: Listener): () => void {
  listeners.add(fn);
  const onStorage = (e: StorageEvent) => {
    if (e.key === FAV_KEY) fn();
  };
  if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(fn);
    if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage);
  };
}
