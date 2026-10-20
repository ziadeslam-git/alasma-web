import type { ReactNode } from 'react';

import { MobileNav } from '@/shared/layout/mobile-nav';
import { SiteFooter } from '@/shared/layout/site-footer';
import { SiteHeader } from '@/shared/layout/site-header';

export default function SiteLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <SiteHeader />
      <main id="main-content">{children}</main>
      <SiteFooter />
      <MobileNav />
    </>
  );
}
