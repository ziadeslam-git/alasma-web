import type { ReactNode } from 'react';

import { SiteShell } from '@/shared/layout/site-shell';

// AuthProvider and the toast area are mounted once in the root layout.
export default function AuthLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <SiteShell>{children}</SiteShell>;
}
