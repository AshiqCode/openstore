/** @type {import('next').NextConfig} */

// This app is deployed to Vercel as a normal Next.js app (NOT a static export).
// It needs a server because card payments require a secret Stripe key, which can
// only ever live server-side — see src/app/api/checkout/route.ts. Everything
// else is still client-rendered and talks straight to Supabase.
//
// Consequence: the store can no longer be deployed by dragging an `out/` folder.
// Deploy from the git repo (Vercel → Import Project) instead.
const nextConfig = {
  images: {
    // All product images are plain <img> tags pointing at Supabase storage;
    // nothing goes through the Next.js image optimizer.
    unoptimized: true,
  },
  // Cleaner URLs: /cart -> /cart/
  // NOTE: this also applies to /api routes, so the Stripe webhook URL must be
  // registered WITH the trailing slash (…/api/stripe/webhook/) — Stripe does not
  // follow the 308 redirect that the un-slashed form returns.
  trailingSlash: true,
  eslint: {
    // Never let lint block a release build.
    ignoreDuringBuilds: true,
  },

  async headers() {
    return [
      {
        // Baseline hardening for every route.
        //
        // No Content-Security-Policy on purpose: the store redirects to Stripe,
        // loads product images from arbitrary Supabase/CDN URLs, and applies
        // themes with inline styles, so a CSP written blind would break real
        // pages. The headers below are the ones that are safe to set globally.
        source: '/:path*',
        headers: [
          // Clickjacking: nothing here is meant to be framed.
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
          // Don't let browsers second-guess declared content types.
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Don't leak the full URL (which can carry ?id=) to third parties.
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // We never ask for these — deny them up front.
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
          },
        ],
      },
      {
        // The admin panel should never appear in search results, and its pages
        // must not be cached by a shared proxy.
        source: '/admin/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
      {
        // API responses are per-request and often reflect a session.
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'X-Robots-Tag', value: 'noindex' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
