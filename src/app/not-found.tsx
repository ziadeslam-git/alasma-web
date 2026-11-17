import type { Metadata } from 'next';

import { NotFoundContent } from '@/shared/layout/status-pages';

import SiteLayout from './(site)/layout';

export const metadata: Metadata = { robots: { index: false, follow: false } };

// A URL that matches no route is outside every layout, so this page brings the SAME shell as the site routes (the
// (site) layout itself: search, cart, account menu, guest menu entries). A notFound() raised inside
// the (site) routes is caught by (site)/not-found.tsx instead, which sits inside that layout's shell (Task 75: the
// root page used to add a second header and footer there).
export default function NotFound() {
  return (
    <SiteLayout>
      <NotFoundContent />
    </SiteLayout>
  );
}
