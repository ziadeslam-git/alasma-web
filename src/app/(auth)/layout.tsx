import type { ReactNode } from 'react';

import { NewsletterForm } from '@/modules/newsletter';
import { SiteShell } from '@/shared/layout/site-shell';

// AuthProvider and the toast area are mounted once in the root layout.
export default function AuthLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <SiteShell newsletter={<NewsletterForm />}>{children}</SiteShell>;
}
