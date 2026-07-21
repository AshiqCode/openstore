'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { Spinner } from '@/components/Spinner';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/Confirm';
import { Modal } from '@/components/Modal';
import { Select } from '@/components/Select';
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  reorderProducts,
  uploadImage,
  getSettings,
  productInActiveOrders,
  type ProductInput,
} from '@/lib/store';
import { compressImage, money } from '@/lib/format';
import { Plus, ChevronUp, ChevronDown, Trash2, ImageOff, Upload, Eye, EyeOff } from 'lucide-react';
import { DEFAULT_SETTINGS, parseCategories, effectivePrice, type Product, type Settings } from '@/lib/types';
import { useT } from '@/components/LanguageProvider';

export default function ProductsPage() {
  return (
    <AdminShell>
      <Products />
    </AdminShell>
  );
}

const EMPTY_FORM: ProductInput = {
  name: '',
  price: 0,
  description: '',
  image_url: '',
  category: 'General',
  stock: 999,
  is_active: true,
  is_featured: false,
  discount_percent: 0,
  sort_order: 0,
};

function Products() {
  const toast = useToast();
  const confirm = useConfirm();
  const S = useT();
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | 'new' | null>(null);

  async function refresh() {
    const [p, s] = await Promise.all([getAllProducts(), getSettings()]);
    setProducts(p);
    setSettings(s);
    setLoading(false);
  }
  useEffect(() => {
    refresh();
  }, []);

  async function toggleActive(p: Product) {
    const ok = await updateProduct(p.id, { is_active: !p.is_active });
    if (ok) {
      setProducts((list) =>
        list.map((x) => (x.id === p.id ? { ...x, is_active: !x.is_active } : x))
      );
    } else toast(S.errSaveFailed, 'error');
  }

  async function move(index: number, dir: -1 | 1) {
    const next = index + dir;
    if (next < 0 || next >= products.length) return;
    const reordered = [...products];
    const [item] = reordered.splice(index, 1);
    reordered.splice(next, 0, item);
    setProducts(reordered); // optimistic
    const ok = await reorderProducts(reordered.map((p) => p.id));
    if (!ok) {
      toast(S.errSaveFailed, 'error');
      refresh();
    }
  }

  async function remove(p: Product) {
    // Block deletion if this product is tied to a live (pending/confirmed) order.
    const locked = await productInActiveOrders(p.id);
    if (locked) {
      await confirm({
        title: 'Cannot delete this product',
        message: `"${p.name}" is part of a pending or confirmed order. Hide it instead so its order history stays intact.`,
        confirmLabel: 'Got it',
        cancelLabel: 'Close',
      });
      return;
    }
    const ok = await confirm({
      title: `Delete "${p.name}"?`,
      message: 'This permanently removes the product from your store.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    const deleted = await deleteProduct(p.id);
    if (deleted) {
      setProducts((list) => list.filter((x) => x.id !== p.id));
      toast('Deleted', 'success');
    } else toast(S.errSaveFailed, 'error');
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="page-title">{S.products}</h1>
          {!loading && (
            <p className="mt-1 text-sm text-muted">
              {products.length} {products.length === 1 ? 'item' : 'items'} ·{' '}
              {products.filter((p) => p.is_active).length} visible
            </p>
          )}
        </div>
        <button className="btn btn-primary" onClick={() => setEditing('new')}>
          <Plus size={16} /> {S.add}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card flex items-center gap-3 p-3">
              <div className="skeleton h-14 w-14 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-3.5 w-1/3" />
                <div className="skeleton h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="card flex flex-col items-center p-12 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-bg text-muted">
            <ImageOff size={24} />
          </div>
          <p className="font-medium">No products yet</p>
          <p className="mt-1 text-sm text-muted">Add your first product to open the store.</p>
          <button className="btn btn-primary mt-5" onClick={() => setEditing('new')}>
            <Plus size={16} /> {S.add}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {products.map((p, i) => (
            <div
              key={p.id}
              className={`card flex items-center gap-3 p-3 transition hover:shadow-md ${
                p.is_active ? '' : 'opacity-70'
              }`}
            >
              <div className="flex flex-col text-muted">
                <button
                  className="rounded p-0.5 hover:bg-bg hover:text-primary disabled:opacity-25"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="Move up"
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  className="rounded p-0.5 hover:bg-bg hover:text-primary disabled:opacity-25"
                  onClick={() => move(i, 1)}
                  disabled={i === products.length - 1}
                  aria-label="Move down"
                >
                  <ChevronDown size={16} />
                </button>
              </div>

              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-theme bg-bg">
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted">
                    <ImageOff size={18} />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{p.name}</div>
                <div className="mt-0.5 text-sm font-medium text-primary">
                  {money(p.price, settings.currency)}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                  <span className="rounded bg-bg px-1.5 py-0.5">{p.category}</span>
                  <span>stock {p.stock}</span>
                </div>
              </div>

              <button
                className="btn-icon text-muted hover:bg-bg"
                onClick={() => toggleActive(p)}
                title={p.is_active ? 'Visible — click to hide' : 'Hidden — click to show'}
              >
                {p.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => setEditing(p)}>
                {S.edit}
              </button>
              <button
                className="btn-icon text-muted hover:bg-bg hover:text-red-600"
                onClick={() => remove(p)}
                aria-label={S.delete}
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <ProductForm
          initial={editing === 'new' ? null : editing}
          currency={settings.currency}
          categories={parseCategories(settings.categories)}
          nextSortOrder={products.length}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function ProductForm({
  initial,
  currency,
  categories,
  nextSortOrder,
  onClose,
  onSaved,
}: {
  initial: Product | null;
  currency: string;
  categories: string[];
  nextSortOrder: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const S = useT();
  const [form, setForm] = useState<ProductInput>(
    initial
      ? {
          name: initial.name,
          price: initial.price,
          description: initial.description,
          image_url: initial.image_url,
          category: initial.category,
          stock: initial.stock,
          is_active: initial.is_active,
          is_featured: initial.is_featured,
          discount_percent: initial.discount_percent,
          sort_order: initial.sort_order,
        }
      : {
          ...EMPTY_FORM,
          sort_order: nextSortOrder,
          category: categories.includes('General') || categories.length === 0 ? 'General' : categories[0],
        }
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  function set<K extends keyof ProductInput>(key: K, value: ProductInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const blob = await compressImage(file);
      const url = await uploadImage(blob, 'products');
      if (url) {
        set('image_url', url);
        toast('Image uploaded', 'success');
      } else {
        toast('Image upload failed — you can paste an image URL instead.', 'error');
      }
    } catch {
      toast('Image upload failed — paste a URL instead.', 'error');
    }
    setUploading(false);
  }

  async function save() {
    if (!form.name.trim()) {
      toast('Name required', 'error');
      return;
    }
    setSaving(true);
    const payload: ProductInput = {
      ...form,
      name: form.name.trim(),
      price: Number(form.price) || 0,
      stock: Number(form.stock) || 0,
      category: form.category.trim() || 'General',
    };
    const ok = initial
      ? await updateProduct(initial.id, payload)
      : await createProduct(payload);
    setSaving(false);
    if (ok) {
      toast(S.saved, 'success');
      onSaved();
    } else {
      toast(S.errSaveFailed, 'error');
    }
  }

  return (
    <Modal open onClose={onClose} title={initial ? 'Edit product' : 'Add product'} size="xl">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 pb-2">
        {/* Image first — big preview + upload */}
        <div>
          <label className="label">Photo</label>
          <div className="flex items-center gap-4">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-theme border border-line bg-bg">
              {form.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.image_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted">
                  <ImageOff size={26} />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <label className="btn btn-outline inline-flex w-full cursor-pointer items-center justify-center gap-1.5 text-sm sm:w-auto">
                {uploading ? <Spinner size={16} /> : <><Upload size={15} /> Upload photo</>}
                <input type="file" accept="image/*" className="hidden" onChange={onFile} />
              </label>
              <input
                className="input mt-2 text-xs"
                placeholder="…or paste an image URL"
                value={form.image_url}
                onChange={(e) => set('image_url', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="label">Name</label>
          <input
            className="input"
            placeholder="Product name"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Price ({currency})</label>
            <input
              className="input"
              type="number"
              inputMode="decimal"
              value={form.price}
              onChange={(e) => set('price', Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label">Stock</label>
            <input
              className="input"
              type="number"
              inputMode="numeric"
              value={form.stock}
              onChange={(e) => set('stock', Number(e.target.value))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Discount %</label>
            <input
              className="input"
              type="number"
              inputMode="numeric"
              min={0}
              max={100}
              value={form.discount_percent}
              onChange={(e) =>
                set('discount_percent', Math.max(0, Math.min(100, Number(e.target.value) || 0)))
              }
            />
          </div>
          <div>
            <label className="label">Category</label>
            {categories.length === 0 ? (
              <div className="rounded-theme border border-dashed border-line p-2.5 text-xs text-muted">
                Add categories in <b>Settings</b> first.
              </div>
            ) : (
              <Select
                value={form.category}
                onChange={(v) => set('category', v)}
                options={[
                  ...(form.category && !categories.includes(form.category)
                    ? [{ value: form.category, label: `${form.category} (removed)` }]
                    : []),
                  ...categories.map((c) => ({ value: c, label: c })),
                ]}
              />
            )}
          </div>
        </div>

        {form.discount_percent > 0 && form.price > 0 && (
          <div className="-mt-1 rounded-theme bg-bg px-3 py-2 text-sm">
            Sale price:{' '}
            <span className="font-semibold text-primary">{money(effectivePrice(form), currency)}</span>{' '}
            <span className="text-muted line-through">{money(form.price, currency)}</span>
          </div>
        )}

        <div>
          <label className="label">Description</label>
          <textarea
            className="input min-h-20"
            placeholder="Short description (optional)"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Toggle
            label="Visible in store"
            checked={form.is_active}
            onChange={(v) => set('is_active', v)}
          />
          <Toggle
            label="⭐ Featured product"
            checked={form.is_featured}
            onChange={(v) => set('is_featured', v)}
          />
        </div>

        {/* Save / Cancel — right below the toggles (not fixed) */}
        <div className="mt-2 flex gap-2">
          <button className="btn btn-outline flex-1" onClick={onClose}>
            {S.cancel}
          </button>
          <button className="btn btn-primary flex-1" onClick={save} disabled={saving || uploading}>
            {saving ? <Spinner size={18} /> : S.save}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-theme border border-line bg-bg px-3 py-2.5">
      <span className="text-sm font-medium">{label}</span>
      <span className="relative inline-block h-6 w-11 shrink-0">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="absolute inset-0 rounded-full bg-line transition peer-checked:bg-primary" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
