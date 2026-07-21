'use client';

import { useEffect } from 'react';

// Registers the service worker so the store is installable (Add to Home screen).
// Service workers only run in a secure context (HTTPS or localhost) — on a plain
// http:// LAN address the install prompt won't appear; deploy to Vercel for it.
export function PWARegister() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* ignore — not fatal */
    });
  }, []);

  return null;
}
