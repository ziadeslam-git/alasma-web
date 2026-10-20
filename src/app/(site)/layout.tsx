import type { ReactNode } from 'react';

import { SiteShell } from '@/shared/layout/site-shell';

export default function SiteLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <SiteShell>{children}</SiteShell>;
}
