import type { Metadata } from 'next';

import { NotFoundContent } from '@/shared/layout/status-pages';

export const metadata: Metadata = { robots: { index: false, follow: false } };

// Rendered inside the (site) layout, which already provides the header, <main> and footer.
export default function SiteNotFound() {
  return <NotFoundContent />;
}
