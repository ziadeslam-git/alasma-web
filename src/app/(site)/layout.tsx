import type { ReactNode } from 'react';

import { SearchOverlay } from '@/modules/search';
import { MiniCart } from '@/modules/cart';
import { SiteShell } from '@/shared/layout/site-shell';

export default function SiteLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <SiteShell search={<SearchOverlay />} cart={<MiniCart />}>
      {children}
    </SiteShell>
  );
}
