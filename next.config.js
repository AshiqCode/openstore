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
};

module.exports = nextConfig;
