'use client';

import { useEffect } from 'react';
import { applyTheme, DEFAULT_THEME_ID } from '@/lib/themes';
import { getSettings } from '@/lib/store';

// Applies the "clean" theme immediately, then swaps to the store's saved theme
// once settings load. Kept as a tiny standalone component so every page (public
// and admin) is themed without each one re-implementing this.
export function ThemeInit() {
  useEffect(() => {
    applyTheme(DEFAULT_THEME_ID);
    let active = true;
    getSettings()
      .then((s) => {
        if (active) applyTheme(s.theme || DEFAULT_THEME_ID);
      })
      .catch(() => {
        /* ignore — default theme already applied */
      });
    return () => {
      active = false;
    };
  }, []);

  return null;
}
