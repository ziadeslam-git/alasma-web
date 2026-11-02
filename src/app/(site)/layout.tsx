import type { ReactNode } from 'react';

import { SearchOverlay } from '@/modules/search';
import { SiteShell } from '@/shared/layout/site-shell';

export default function SiteLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <SiteShell search={<SearchOverlay />}>{children}</SiteShell>;
}
