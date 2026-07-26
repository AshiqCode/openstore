'use client';

import { useEffect } from 'react';
import { getSettings } from '@/lib/store';

const FAVICON_ID = 'app-favicon';

// Applies the admin-uploaded favicon and the current store name to the browser
// tab, from Supabase, at runtime.
//
// Both are also baked into the HTML by generateMetadata() at BUILD time (social
// scrapers don't run JS, so the og: tags must be static). But renaming the store
// in Settings must not leave a stale tab title until the next deploy — so we
// re-apply the live values here on every page load.
//
// The favicon uses ONE dedicated <link id="app-favicon"> and only updates its
// href — it never removes the icon links Next.js/React renders (doing so causes
// React to crash with "Cannot read properties of null (reading 'removeChild')").
// Appending our link last makes browsers prefer the uploaded favicon.
export function FaviconSetter() {
  useEffect(() => {
    let active = true;
    getSettings()
      .then((s) => {
        if (!active) return;

        if (s.store_name && document.title !== s.store_name) {
          document.title = s.store_name;
        }

        if (!s.favicon_url) return;
        let link = document.getElementById(FAVICON_ID) as HTMLLinkElement | null;
        if (!link) {
          link = document.createElement('link');
          link.id = FAVICON_ID;
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = s.favicon_url;
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return null;
}
