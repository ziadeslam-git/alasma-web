import type { ReactNode } from 'react';

import { AccountMenu, MenuAccountTile, MenuLogout } from '@/modules/account';
import { CartCountBadge, MiniCart } from '@/modules/cart';
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
        cartBadge={<CartCountBadge />}
        menuAccountTile={<MenuAccountTile />}
        menuFooter={<MenuLogout />}
        newsletter={<NewsletterForm />}
        search={<SearchOverlay />}
      >
        {children}
      </SiteShell>
    </ServerFeatureFlagsProvider>
  );
}
