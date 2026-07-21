'use client';

import { useEffect, useState } from 'react';
import { Camera, ThumbsUp, Music2, Mail, MapPin, MessageCircle, Store } from 'lucide-react';
import { StoreNav } from '@/components/StoreNav';
import { StoreFooter } from '@/components/StoreFooter';
import { FullPageSpinner } from '@/components/Spinner';
import { useConfigGuard } from '@/lib/useConfigGuard';
import { getSettings } from '@/lib/store';
import { toWaNumber } from '@/lib/format';
import { DEFAULT_SETTINGS, type Settings } from '@/lib/types';

export default function AboutPage() {
  const guard = useConfigGuard();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (guard !== 'ready') return;
    getSettings().then((s) => {
      setSettings(s);
      setLoading(false);
    });
  }, [guard]);

  if (guard !== 'ready' || loading) return <FullPageSpinner />;

  const links = [
    settings.instagram_link && { href: settings.instagram_link, icon: Camera, label: 'Instagram' },
    settings.facebook_link && { href: settings.facebook_link, icon: ThumbsUp, label: 'Facebook' },
    settings.tiktok_link && { href: settings.tiktok_link, icon: Music2, label: 'TikTok' },
  ].filter(Boolean) as { href: string; icon: typeof Camera; label: string }[];

  const wa = toWaNumber(settings.whatsapp_number);

  return (
    <div className="min-h-screen">
      <StoreNav settings={settings} />
      <main className="mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="hero-tint card flex items-center gap-4 p-6">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary text-[color:var(--color-primary-fg)]">
            {settings.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.logo_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <Store size={28} />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold">{settings.store_name}</h1>
            {settings.tagline && <p className="text-muted">{settings.tagline}</p>}
            {settings.seller_name && (
              <p className="mt-0.5 text-sm text-muted">by {settings.seller_name}</p>
            )}
          </div>
        </div>

        {/* About */}
        <div className="card mt-4 p-6">
          <h2 className="font-semibold">About</h2>
          {settings.about_text ? (
            <p className="mt-2 whitespace-pre-line text-muted">{settings.about_text}</p>
          ) : (
            <p className="mt-2 text-muted">This store hasn&apos;t added an about section yet.</p>
          )}
        </div>

        {/* Contact */}
        <div className="card mt-4 p-6">
          <h2 className="mb-3 font-semibold">Get in touch</h2>
          <div className="flex flex-col gap-3">
            {wa && (
              <a
                href={`https://wa.me/${wa}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm hover:text-primary"
              >
                <MessageCircle size={16} className="text-primary" /> WhatsApp: {settings.whatsapp_number}
              </a>
            )}
            {settings.contact_email && (
              <a
                href={`mailto:${settings.contact_email}`}
                className="flex items-center gap-2 text-sm hover:text-primary"
              >
                <Mail size={16} className="text-primary" /> {settings.contact_email}
              </a>
            )}
            {settings.store_address && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin size={16} className="text-primary" /> {settings.store_address}
              </div>
            )}
          </div>

          {links.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline btn-sm inline-flex items-center gap-1.5"
                >
                  <l.icon size={15} /> {l.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </main>
      <StoreFooter settings={settings} />
    </div>
  );
}
