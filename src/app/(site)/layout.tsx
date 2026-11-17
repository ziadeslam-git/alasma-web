import type { ReactNode } from 'react';

import { AccountMenu, GuestMenuLinks } from '@/modules/account';
import { MiniCart } from '@/modules/cart';
import { SearchOverlay } from '@/modules/search';
import { ServerFeatureFlagsProvider } from '@/shared/config/feature-flags';
import { SiteShell } from '@/shared/layout/site-shell';

export default function SiteLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <ServerFeatureFlagsProvider>
      <SiteShell
        accountArea={<AccountMenu />}
        cart={<MiniCart />}
        menuAccount={<GuestMenuLinks />}
        search={<SearchOverlay />}
      >
        {children}
      </SiteShell>
    </ServerFeatureFlagsProvider>
  );
}
