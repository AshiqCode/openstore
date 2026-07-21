'use client';

import { useEffect, useState } from 'react';
import { applyTheme, DEFAULT_THEME_ID, THEME_CACHE_KEY } from '@/lib/themes';
import { getSettings } from '@/lib/store';
import { FullPageSpinner } from '@/components/Spinner';

// Gates the app until the store's theme is known, so visitors never see the
// default theme flash into the selected one.
//
// - Returning visitor (theme cached): the layout boot script already applied
//   the correct theme before paint, so we render immediately and just refresh
//   from settings in the background.
// - First visit (no cache): show a loader while we fetch the theme, then reveal
//   the content already themed.
export function ThemeGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    let hasCache = false;
    try {
      hasCache = !!localStorage.getItem(THEME_CACHE_KEY);
    } catch {
      /* ignore */
    }

    if (hasCache) {
      setReady(true); // boot script already painted the right theme
      getSettings()
        .then((s) => active && applyTheme(s.theme || DEFAULT_THEME_ID))
        .catch(() => {});
    } else {
      applyTheme(DEFAULT_THEME_ID);
      getSettings()
        .then((s) => {
          if (!active) return;
          applyTheme(s.theme || DEFAULT_THEME_ID);
          setReady(true);
        })
        .catch(() => active && setReady(true));
    }

    return () => {
      active = false;
    };
  }, []);

  if (!ready) return <FullPageSpinner />;
  return <>{children}</>;
}
