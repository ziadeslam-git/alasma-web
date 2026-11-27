import type { ReactNode } from 'react';

import { MobileNav } from '@/shared/layout/mobile-nav';
import { PageFrame } from '@/shared/layout/page-frame';
import { SiteFooter } from '@/shared/layout/site-footer';
import { SiteHeader } from '@/shared/layout/site-header';
import { SplashOverlay } from '@/shared/layout/splash-overlay';

export function SiteShell({
  children,
  search,
  cart,
  cartBadge,
  accountArea,
  menuAccount,
  menuAccountTile,
  menuFooter,
  newsletter,
}: {
  children: ReactNode;
  search?: ReactNode;
  cart?: ReactNode;
  cartBadge?: ReactNode;
  accountArea?: ReactNode;
  menuAccount?: ReactNode;
  menuAccountTile?: ReactNode;
  menuFooter?: ReactNode;
  newsletter?: ReactNode;
}) {
  return (
    <PageFrame>
      <SiteHeader
        search={search}
        cart={cart}
        cartBadge={cartBadge}
        accountArea={accountArea}
        menuAccount={menuAccount}
        menuAccountTile={menuAccountTile}
        menuFooter={menuFooter}
      />
      <main id="main-content">{children}</main>
      <SiteFooter newsletter={newsletter} />
      <MobileNav cartBadge={cartBadge} />
      <SplashOverlay />
    </PageFrame>
  );
}
