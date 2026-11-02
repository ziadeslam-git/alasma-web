import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AccountShell } from '@/modules/account';
import { RequireAuth } from '@/modules/auth';
import { MiniCart } from '@/modules/cart';
import { SearchOverlay } from '@/modules/search';
import { SiteHeader } from '@/shared/layout/site-header';
import { SiteFooter } from '@/shared/layout/site-footer';
import { MobileNav } from '@/shared/layout/mobile-nav';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader cart={<MiniCart />} search={<SearchOverlay />} />
      <RequireAuth>
        <AccountShell>{children}</AccountShell>
      </RequireAuth>
      <SiteFooter />
      <MobileNav />
    </>
  );
}
