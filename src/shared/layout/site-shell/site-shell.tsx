import type { ReactNode } from 'react';

import { MobileNav } from '@/shared/layout/mobile-nav';
import { SiteFooter } from '@/shared/layout/site-footer';
import { SiteHeader } from '@/shared/layout/site-header';
import { SplashOverlay } from '@/shared/layout/splash-overlay';

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main-content">{children}</main>
      <SiteFooter />
      <MobileNav />
      <SplashOverlay />
    </>
  );
}
