import type { ReactNode } from 'react';

import { AccountMenu, GuestMenuLinks, MenuLogout, SignedInMenuLinks } from '@/modules/account';
import { MiniCart } from '@/modules/cart';
import { NewsletterForm } from '@/modules/newsletter';
import { SearchOverlay } from '@/modules/search';
import { ServerFeatureFlagsProvider } from '@/shared/config/feature-flags';
import { SiteShell } from '@/shared/layout/site-shell';

export default function SiteLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <ServerFeatureFlagsProvider>
      <SiteShell
        accountArea={<AccountMenu />}
        cart={<MiniCart />}
        menuAccount={
          <>
            <GuestMenuLinks />
            <SignedInMenuLinks />
          </>
        }
        menuFooter={<MenuLogout />}
        newsletter={<NewsletterForm />}
        search={<SearchOverlay />}
      >
        {children}
      </SiteShell>
    </ServerFeatureFlagsProvider>
  );
}
