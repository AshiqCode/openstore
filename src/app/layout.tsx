import type { Metadata, Viewport } from 'next';
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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'OPEN STORE',
  description: DESCRIPTION,
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  appleWebApp: {
    capable: true,
    title: 'OPEN STORE',
    statusBarStyle: 'default',
  },
  // Link-preview (thumbnail) card shown when the URL is shared.
  openGraph: {
    type: 'website',
    siteName: 'OPEN STORE',
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'OPEN STORE' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/og.png'],
  },
};

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
