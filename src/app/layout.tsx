import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Importing the module registers the self-hosted @font-face rules (no Google request).
import '@/shared/config/fonts';
import '@/styles/globals.css';

import messages from '@/i18n/messages/ar.json';
import { AuthProvider } from '@/modules/auth';
import { ToastProvider } from '@/shared/ui/toast';

export const metadata: Metadata = {
  title: 'Al-Asma Pro',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <AuthProvider>
          <ToastProvider label={messages.auth.toastLabel}>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
