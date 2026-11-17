'use client';

import { ErrorContent } from '@/shared/layout/status-pages';

// Last-resort boundary for errors above the (site) layout (its own providers failing). The shell may be what failed, so
// it is not rebuilt here, but the page still has one <main> and one <h1>. Errors inside the site routes are caught by
// (site)/error.tsx, which keeps the shell.
export default function ErrorPage({
  error,
  reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  return (
    <main id="main-content">
      <ErrorContent error={error} reset={reset} />
    </main>
  );
}
