'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { Spinner } from '@/components/Spinner';
import { useToast } from '@/components/Toast';
import { getSettings, saveSettings, uploadImage } from '@/lib/store';
import { refreshOgCard } from '@/lib/ogCard';
import { compressImage } from '@/lib/format';
import {
  ImageOff,
  Upload,
  Store,
  UserRound,
  Share2,
  Truck,
  Tags,
  Plus,
  X,
  type LucideIcon,
} from 'lucide-react';
import { DEFAULT_SETTINGS, parseCategories, type Settings } from '@/lib/types';
import { useT } from '@/components/LanguageProvider';

export default function SettingsPage() {
  return (
    <AdminShell>
      <SettingsForm />
    </AdminShell>
  );
}

type Field = {
  key: keyof Settings;
  label: string;
  type?: 'text' | 'textarea' | 'number';
  placeholder?: string;
};

function SettingsForm() {
  const toast = useToast();
  const S = useT();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newCat, setNewCat] = useState('');

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  function set<K extends keyof Settings>(key: K, value: string) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  const categories = parseCategories(settings.categories);

  // Categories auto-save to the DB as you add/remove them (no need to hit Save).
  async function persistCategories(list: string[]) {
    const json = JSON.stringify(Array.from(new Set(list.map((c) => c.trim()).filter(Boolean))));
    set('categories', json);
    const ok = await saveSettings({ categories: json });
    if (!ok) toast(S.errSaveFailed, 'error');
  }
  function addCategory() {
    const name = newCat.trim();
    if (!name) return;
    if (categories.some((c) => c.toLowerCase() === name.toLowerCase())) {
      toast('That category already exists', 'error');
      return;
    }
    setNewCat('');
    persistCategories([...categories, name]);
    toast('Category added', 'success');
  }

  async function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const blob = await compressImage(file, 400, 0.85);
      const url = await uploadImage(blob, 'logo');
      if (url) {
        set('logo_url', url);
        toast('Logo uploaded — remember to Save', 'success');
      } else toast('Upload failed', 'error');
    } catch {
      toast('Upload failed', 'error');
    }
    setUploading(false);
  }

  // Favicon (browser tab icon). Saved immediately so it applies right away.
  async function onFavicon(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const blob = await compressImage(file, 64, 0.9);
      const url = await uploadImage(blob, 'favicon');
      if (url) {
        set('favicon_url', url);
        await saveSettings({ favicon_url: url });
        toast('Favicon updated', 'success');
        void refreshOgCard({ ...settings, favicon_url: url });
      } else toast('Upload failed', 'error');
    } catch {
      toast('Upload failed', 'error');
    }
    setUploading(false);
  }

  async function save() {
    setSaving(true);
    const ok = await saveSettings({
      store_name: settings.store_name,
      tagline: settings.tagline,
      currency: settings.currency,
      logo_url: settings.logo_url,
      favicon_url: settings.favicon_url,
      store_open: settings.store_open,
      seller_name: settings.seller_name,
      about_text: settings.about_text,
      contact_email: settings.contact_email,
      store_address: settings.store_address,
      whatsapp_number: settings.whatsapp_number,
      instagram_link: settings.instagram_link,
      facebook_link: settings.facebook_link,
      tiktok_link: settings.tiktok_link,
      delivery_charges: String(Number(settings.delivery_charges) || 0),
      free_delivery_over: String(Number(settings.free_delivery_over) || 0),
      categories: settings.categories,
    });
    setSaving(false);
    toast(ok ? S.saved : S.errSaveFailed, ok ? 'success' : 'error');
    // Keep the shared-link preview card in sync with the store name/tagline.
    if (ok) void refreshOgCard(settings);
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted">
        <Spinner size={18} /> Loading…
      </div>
    );
  }

  const field = (f: Field) => (
    <div key={f.key}>
      <label className="label">{f.label}</label>
      {f.type === 'textarea' ? (
        <textarea
          className="input min-h-24"
          value={settings[f.key]}
          placeholder={f.placeholder}
          onChange={(e) => set(f.key, e.target.value)}
        />
      ) : (
        <input
          className="input"
          type={f.type === 'number' ? 'number' : 'text'}
          inputMode={f.type === 'number' ? 'numeric' : undefined}
          value={settings[f.key]}
          placeholder={f.placeholder}
          onChange={(e) => set(f.key, e.target.value)}
        />
      )}
    </div>
  );

  return (
    <div className="animate-fade-up max-w-3xl pb-24">
      <h1 className="page-title mb-4">{S.settings}</h1>

      <div className="flex flex-col gap-4">
        {/* Store */}
        <Section icon={Store} title="Store">
          <div>
            <label className="label">Logo</label>
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-theme bg-bg">
                {settings.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={settings.logo_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted">
                    <ImageOff size={20} />
                  </div>
                )}
              </div>
              <label className="btn btn-outline inline-flex cursor-pointer items-center gap-1.5 text-sm">
                {uploading ? <Spinner size={16} /> : <><Upload size={15} /> Upload logo</>}
                <input type="file" accept="image/*" className="hidden" onChange={onLogo} />
              </label>
            </div>
          </div>

          {/* Favicon (browser tab icon) */}
          <div>
            <label className="label">Favicon (browser tab icon)</label>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-theme border border-line bg-bg">
                {settings.favicon_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={settings.favicon_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImageOff size={16} className="text-muted" />
                )}
              </div>
              <label className="btn btn-outline inline-flex cursor-pointer items-center gap-1.5 text-sm">
                {uploading ? <Spinner size={16} /> : <><Upload size={15} /> Upload favicon</>}
                <input type="file" accept="image/*" className="hidden" onChange={onFavicon} />
              </label>
            </div>
            <p className="mt-1 text-xs text-muted">
              Small square image (PNG). Applies to the browser tab immediately.
            </p>
          </div>

          {field({ key: 'store_name', label: 'Store name' })}
          {field({ key: 'tagline', label: 'Tagline', placeholder: 'Best deals in town' })}
          {field({ key: 'currency', label: 'Currency prefix', placeholder: 'Rs.' })}
          <label className="flex items-center gap-3 rounded-theme border border-line bg-bg p-3">
            <input
              type="checkbox"
              checked={settings.store_open === 'true'}
              onChange={(e) => set('store_open', e.target.checked ? 'true' : 'false')}
            />
            <span className="text-sm">
              <b>Store is open</b> — customers can place orders. Turn off to pause the shop.
            </span>
          </label>
        </Section>

        {/* Seller profile / branding */}
        <Section icon={UserRound} title="Seller profile & branding">
          {field({ key: 'seller_name', label: 'Your name (seller)', placeholder: 'Ali Khan' })}
          {field({ key: 'about_text', label: 'About the store', type: 'textarea' })}
          {field({ key: 'contact_email', label: 'Contact email', placeholder: 'you@example.com' })}
          {field({ key: 'store_address', label: 'Store address', placeholder: 'City, area' })}
        </Section>

        {/* Social */}
        <Section icon={Share2} title="Contact & social">
          {field({ key: 'whatsapp_number', label: 'WhatsApp number', placeholder: '03xx xxxxxxx' })}
          {field({ key: 'instagram_link', label: 'Instagram', placeholder: 'https://instagram.com/...' })}
          {field({ key: 'facebook_link', label: 'Facebook', placeholder: 'https://facebook.com/...' })}
          {field({ key: 'tiktok_link', label: 'TikTok', placeholder: 'https://tiktok.com/@...' })}
        </Section>

        {/* Delivery */}
        <Section icon={Truck} title="Delivery">
          {field({ key: 'delivery_charges', label: 'Delivery charges', type: 'number' })}
          {field({
            key: 'free_delivery_over',
            label: 'Free delivery over (0 = off)',
            type: 'number',
            placeholder: '2000',
          })}
        </Section>

        {/* Categories */}
        <Section icon={Tags} title="Categories">
          <p className="text-sm text-muted">
            These show as filters on your store and as suggestions when adding products.
          </p>
          <div className="flex flex-wrap gap-2">
            {categories.length === 0 && <span className="text-sm text-muted">No categories yet.</span>}
            {categories.map((c) => (
              <span key={c} className="chip cursor-default">
                {c}
                <button
                  className="ml-1 text-muted hover:text-red-600"
                  onClick={() => persistCategories(categories.filter((x) => x !== c))}
                  aria-label={`Remove ${c}`}
                >
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="input"
              placeholder="New category (e.g. Shoes)"
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCategory();
                }
              }}
            />
            <button className="btn btn-outline shrink-0" onClick={addCategory} type="button">
              <Plus size={16} /> Add
            </button>
          </div>
        </Section>
      </div>

      {/* Sticky save bar */}
      <div className="sticky bottom-0 z-10 mt-4 -mb-4 border-t border-line bg-bg/90 py-3 backdrop-blur">
        <button className="btn btn-primary w-full sm:w-auto" onClick={save} disabled={saving || uploading}>
          {saving ? <Spinner size={18} /> : `${S.save} settings`}
        </button>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-5">
      <div className="mb-4 flex items-center gap-2 border-b border-line pb-3">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{
            background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)',
            color: 'var(--color-primary)',
          }}
        >
          <Icon size={17} />
        </div>
        <h2 className="font-semibold">{title}</h2>
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}
