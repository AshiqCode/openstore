// Minimal service worker — enables PWA install + basic offline for the app shell.
// Only same-origin GET requests are cached; Supabase/API calls pass straight
// through to the network so store data is never served stale.

const CACHE = 'openstore-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin GET requests (app shell, JS/CSS, /config.json…).
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      try {
        // Network-first: always fresh online, cache as we go.
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put(req, fresh.clone());
        return fresh;
      } catch (err) {
        // Offline: fall back to cache, then to the home page for navigations.
        const cached = await caches.match(req);
        if (cached) return cached;
        if (req.mode === 'navigate') {
          const home = await caches.match('/');
          if (home) return home;
        }
        throw err;
      }
    })()
  );
});
