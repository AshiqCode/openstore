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

export const metadata: Metadata = {
  title: 'OPEN STORE',
  description: 'OPEN STORE — shop online, order on WhatsApp.',
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
