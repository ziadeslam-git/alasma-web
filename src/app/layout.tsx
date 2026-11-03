import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Importing the module registers the self-hosted @font-face rules (no Google request).
import '@/shared/config/fonts';
import '@/styles/globals.css';

import messages from '@/i18n/messages/ar.json';
import { AuthProvider } from '@/modules/auth';
import { AttemptSessionObserver } from '@/modules/checkout';
import { getSiteUrl } from '@/shared/config/site';
import { ToastProvider } from '@/shared/ui/toast';

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: messages.seo.defaultTitle,
    template: messages.seo.titleTemplate,
  },
  description: messages.seo.defaultDescription,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <AuthProvider>
          <AttemptSessionObserver />
          <ToastProvider label={messages.auth.toastLabel}>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
