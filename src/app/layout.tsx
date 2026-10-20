import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Importing the module registers the self-hosted @font-face rules (no Google request).
import '@/shared/config/fonts';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Al-Asma Pro',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
