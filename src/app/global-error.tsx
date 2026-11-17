'use client';

import '@/styles/globals.css';

import { ErrorContent } from '@/shared/layout/status-pages';

// Replaces the root layout, so there is no header or footer to keep (and no providers): <main> and one <h1> only.
export default function GlobalError({
  error,
  reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  return (
    <html dir="rtl" lang="ar">
      <body>
        <main id="main-content">
          <ErrorContent error={error} reset={reset} />
        </main>
      </body>
    </html>
  );
}
