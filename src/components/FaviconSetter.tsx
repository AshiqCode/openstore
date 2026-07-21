'use client';

import { useEffect } from 'react';
import { getSettings } from '@/lib/store';

// Applies the admin-uploaded favicon (stored in Supabase) as the site favicon.
export function FaviconSetter() {
  useEffect(() => {
    getSettings()
      .then((s) => {
        if (!s.favicon_url) return;
        const head = document.head;
        // Remove any existing icon links, then add ours.
        head
          .querySelectorAll("link[rel~='icon']")
          .forEach((el) => el.parentElement?.removeChild(el));
        const link = document.createElement('link');
        link.rel = 'icon';
        link.href = s.favicon_url;
        head.appendChild(link);
      })
      .catch(() => {});
  }, []);

  return null;
}
