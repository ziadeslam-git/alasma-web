'use client';

import { ErrorContent } from '@/shared/layout/status-pages';

// A boundary inside the (site) layout: the header and footer stay, and only the page area shows the error.
export default function SiteError({
  error,
  reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  return <ErrorContent error={error} reset={reset} />;
}
