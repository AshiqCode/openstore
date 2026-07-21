'use client';

import Link from 'next/link';
import { Camera, MessageCircle, ThumbsUp, Music2, Mail, MapPin, type LucideIcon } from 'lucide-react';
import { BUILDER_NAME, BUILDER_URL, DISCLAIMER_SHORT } from '@/lib/brand';
import type { Settings } from '@/lib/types';

export function StoreFooter({ settings }: { settings: Settings }) {
  const socials = [
    settings.instagram_link && { href: settings.instagram_link, icon: Camera, label: 'Instagram' },
    settings.facebook_link && { href: settings.facebook_link, icon: ThumbsUp, label: 'Facebook' },
    settings.tiktok_link && { href: settings.tiktok_link, icon: Music2, label: 'TikTok' },
  ].filter(Boolean) as { href: string; icon: LucideIcon; label: string }[];

  return (
    <footer className="mt-12 border-t border-line">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 py-9 text-center text-sm text-muted">
        <div>
          <div className="text-base font-semibold text-ink">{settings.store_name || 'OPEN STORE'}</div>
          {settings.tagline && <div className="text-xs">{settings.tagline}</div>}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/about" className="hover:text-primary">
            About
          </Link>
          <Link href="/track" className="hover:text-primary">
            Track order
          </Link>
          {socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-primary"
            >
              <s.icon size={15} /> {s.label}
            </a>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
          {settings.whatsapp_number && (
            <span className="inline-flex items-center gap-1.5">
              <MessageCircle size={14} /> {settings.whatsapp_number}
            </span>
          )}
          {settings.contact_email && (
            <a
              href={`mailto:${settings.contact_email}`}
              className="inline-flex items-center gap-1.5 hover:text-primary"
            >
              <Mail size={14} /> {settings.contact_email}
            </a>
          )}
          {settings.store_address && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={14} /> {settings.store_address}
            </span>
          )}
        </div>

        <div className="mt-1 opacity-80">
          Built by{' '}
          <a
            href={BUILDER_URL}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-primary hover:underline"
          >
            {BUILDER_NAME}
          </a>
        </div>
        <p className="mx-auto mt-2 max-w-xl text-[11px] leading-relaxed opacity-70">
          {DISCLAIMER_SHORT}
        </p>
      </div>
    </footer>
  );
}
