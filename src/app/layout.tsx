import type { Metadata, Viewport } from 'next';
import { createClient } from '@supabase/supabase-js';
import '@/styles/globals.css';
import { ThemeGate } from '@/components/ThemeInit';
import { ToastProvider } from '@/components/Toast';
import { ConfirmProvider } from '@/components/Confirm';
import { LanguageProvider } from '@/components/LanguageProvider';
import { CustomerProvider } from '@/components/CustomerProvider';
import { FaviconSetter } from '@/components/FaviconSetter';
import { PWARegister } from '@/components/PWARegister';
import { THEME_BOOT_SCRIPT } from '@/lib/themes';

// Absolute site URL, needed so shared-link previews (WhatsApp, Facebook, X…)
// can load the og:image. Resolved at BUILD time: an explicit NEXT_PUBLIC_SITE_URL
// wins; otherwise Vercel's automatic production-domain var is used; localhost is
// the last resort (previews aren't scraped locally anyway).
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000');

const TITLE = 'OPEN STORE — your online store in minutes';
const DESCRIPTION =
  'Launch your own online store for free, no coding. Add products, pick from 18 themes, and get orders straight to WhatsApp. Deploy in one click, own your data.';

// Read the store's branding from Supabase at BUILD time so the shared-link
// preview (og:image) uses the owner's uploaded favicon/logo — social scrapers
// don't run JS, so the value must be baked into the HTML at build, not applied
// at runtime. Falls back to the bundled og.png if anything is missing.
async function getStoreBranding(): Promise<{ name?: string; image?: string }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return {};
  try {
    const supabase = createClient(url, key);
    const { data } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['store_name', 'favicon_url', 'logo_url']);
    if (!data) return {};
    const map = Object.fromEntries(data.map((r) => [r.key, r.value])) as Record<string, string>;
    return {
      name: map.store_name || undefined,
      image: map.favicon_url || map.logo_url || undefined,
    };
  } catch {
    return {};
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const { name, image } = await getStoreBranding();
  const storeName = name || 'OPEN STORE';
  const ogTitle = name ? `${name} — online store` : TITLE;
  // An external favicon/logo URL is already absolute and has unknown dimensions;
  // the bundled fallback is a proper 1200×630 card.
  const ogImages = image
    ? [{ url: image, alt: storeName }]
    : [{ url: '/og.png', width: 1200, height: 630, alt: storeName }];

  return {
    metadataBase: new URL(SITE_URL),
    title: storeName,
    description: DESCRIPTION,
    manifest: '/manifest.webmanifest',
    icons: {
      icon: image || '/icon.svg',
      apple: image || '/icon.svg',
    },
    appleWebApp: {
      capable: true,
      title: storeName,
      statusBarStyle: 'default',
    },
    // Link-preview (thumbnail) card shown when the URL is shared.
    openGraph: {
      type: 'website',
      siteName: storeName,
      title: ogTitle,
      description: DESCRIPTION,
      url: SITE_URL,
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: DESCRIPTION,
      images: [image || '/og.png'],
    },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Mobile-first; the store must work well on a 360px phone.
  maximumScale: 5,
  themeColor: '#111827',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Applies the cached theme before first paint → no default-theme flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body>
        <LanguageProvider>
          <ToastProvider>
            <ConfirmProvider>
              <CustomerProvider>
                <FaviconSetter />
                <PWARegister />
                {/* Gates content until the theme is known (loader on first visit). */}
                <ThemeGate>
                  {children}
                </ThemeGate>
              </CustomerProvider>
            </ConfirmProvider>
          </ToastProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
