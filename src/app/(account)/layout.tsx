import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AccountMenu, AccountShell, MenuLogout, SignedInMenuLinks } from '@/modules/account';
import { RequireAuth } from '@/modules/auth';
import { CartCountBadge, MiniCart } from '@/modules/cart';
import { NewsletterForm } from '@/modules/newsletter';
import { SearchOverlay } from '@/modules/search';
import { SiteHeader } from '@/shared/layout/site-header';
import { SiteFooter } from '@/shared/layout/site-footer';
import { MobileNav } from '@/shared/layout/mobile-nav';
import { PageFrame, PageFrameGrow } from '@/shared/layout/page-frame';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <PageFrame>
      <SiteHeader
        accountArea={<AccountMenu />}
        cart={<MiniCart />}
        menuAccount={<SignedInMenuLinks />}
        menuFooter={<MenuLogout />}
        search={<SearchOverlay />}
      />
      <PageFrameGrow>
        <RequireAuth>
          <AccountShell>{children}</AccountShell>
        </RequireAuth>
      </PageFrameGrow>
      <SiteFooter newsletter={<NewsletterForm />} />
      <MobileNav cartBadge={<CartCountBadge />} />
    </PageFrame>
  );
}
