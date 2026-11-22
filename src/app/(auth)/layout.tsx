import type { ReactNode } from 'react';

import { AccountMenu, GuestMenuLinks, MenuLogout, SignedInMenuLinks } from '@/modules/account';
import { CartCountBadge, MiniCart } from '@/modules/cart';
import { NewsletterForm } from '@/modules/newsletter';
import { SiteShell } from '@/shared/layout/site-shell';

// AuthProvider and the toast area are mounted once in the root layout.
export default function AuthLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <SiteShell
      accountArea={<AccountMenu />}
      cart={<MiniCart />}
      cartBadge={<CartCountBadge />}
      menuAccount={
        <>
          <GuestMenuLinks />
          <SignedInMenuLinks />
        </>
      }
      menuFooter={<MenuLogout />}
      newsletter={<NewsletterForm />}
    >
      {children}
    </SiteShell>
  );
}
