import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import { ThemeGate } from '@/components/ThemeInit';
import { ToastProvider } from '@/components/Toast';
import { ConfirmProvider } from '@/components/Confirm';
import { LanguageProvider } from '@/components/LanguageProvider';
import { CustomerProvider } from '@/components/CustomerProvider';
import { DisclaimerNotice } from '@/components/DisclaimerNotice';
import { THEME_BOOT_SCRIPT } from '@/lib/themes';

export const metadata: Metadata = {
  title: 'OPEN STORE',
  description: 'OPEN STORE — shop online, order on WhatsApp.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Mobile-first; the store must work well on a 360px phone.
  maximumScale: 5,
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
                {/* Gates content until the theme is known (loader on first visit). */}
                <ThemeGate>
                  <DisclaimerNotice />
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
