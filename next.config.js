/** @type {import('next').NextConfig} */

// CRITICAL: static export so the whole app is plain files the owner can
// drag-and-drop into Vercel. No server, no API routes, no middleware.
const nextConfig = {
  output: 'export',
  images: {
    // Static export cannot run the Next.js image optimizer.
    unoptimized: true,
  },
  // Cleaner static URLs: /cart -> /cart/index.html
  trailingSlash: true,
  eslint: {
    // Never let lint block a release build.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
