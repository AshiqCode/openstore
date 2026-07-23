// Shared domain types.

export type Product = {
  id: string;
  name: string;
  price: number;
  description: string;
  image_url: string;
  category: string;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  discount_percent: number;
  sort_order: number;
  created_at: string;
};

export type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled';

export type OrderItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  image_url?: string;
};

export type Order = {
  id: string;
  customer_name: string;
  customer_email: string;
  phone: string;
  address: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  created_at: string;
};

// The settings table is a flat key/value store; this is the typed view of it.
export type Settings = {
  store_name: string;
  theme: string;
  whatsapp_number: string;
  currency: string;
  banner_text: string;
  logo_url: string;
  favicon_url: string;
  delivery_charges: string;
  about_text: string;
  instagram_link: string;
  setup_complete: string;
  // Branding / seller profile
  tagline: string;
  seller_name: string;
  contact_email: string;
  store_address: string;
  facebook_link: string;
  tiktok_link: string;
  // Catalog + shop controls
  categories: string; // JSON array of category names
  store_open: string; // 'true' | 'false'
  free_delivery_over: string; // amount; 0 = off
};

export const SETTINGS_KEYS: (keyof Settings)[] = [
  'store_name',
  'theme',
  'whatsapp_number',
  'currency',
  'banner_text',
  'logo_url',
  'favicon_url',
  'delivery_charges',
  'about_text',
  'instagram_link',
  'setup_complete',
  'tagline',
  'seller_name',
  'contact_email',
  'store_address',
  'facebook_link',
  'tiktok_link',
  'categories',
  'store_open',
  'free_delivery_over',
];

export const DEFAULT_SETTINGS: Settings = {
  store_name: 'OPEN STORE',
  theme: 'clean',
  whatsapp_number: '',
  currency: 'Rs.',
  banner_text: '',
  logo_url: '',
  favicon_url: '',
  delivery_charges: '0',
  about_text: '',
  instagram_link: '',
  setup_complete: 'true',
  tagline: '',
  seller_name: '',
  contact_email: '',
  store_address: '',
  facebook_link: '',
  tiktok_link: '',
  categories: '[]',
  store_open: 'true',
  free_delivery_over: '0',
};

// Parse the categories setting (JSON array) safely.
export function parseCategories(raw: string): string[] {
  try {
    const arr = JSON.parse(raw || '[]');
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string' && x.trim()) : [];
  } catch {
    return [];
  }
}

// Price after discount. discount_percent is 0–100.
export function effectivePrice(p: Pick<Product, 'price' | 'discount_percent'>): number {
  const d = Math.max(0, Math.min(100, Number(p.discount_percent) || 0));
  return Math.round(p.price * (1 - d / 100));
}
