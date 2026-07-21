import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import { ThemeInit } from '@/components/ThemeInit';
import { ToastProvider } from '@/components/Toast';
import { ConfirmProvider } from '@/components/Confirm';
import { LanguageProvider } from '@/components/LanguageProvider';
import { CustomerProvider } from '@/components/CustomerProvider';
import { DisclaimerNotice } from '@/components/DisclaimerNotice';

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
    <html lang="en">
      <body>
        <LanguageProvider>
          <ToastProvider>
            <ConfirmProvider>
              <CustomerProvider>
                {/* Applies the saved theme as early as possible on the client. */}
                <ThemeInit />
                <DisclaimerNotice />
                {children}
              </CustomerProvider>
            </ConfirmProvider>
          </ToastProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
