'use client';

import Link from 'next/link';

import messages from '@/i18n/messages/ar.json';
import { useAuth } from '@/modules/auth';
import { routes } from '@/shared/config/routes';

// Login and register entries for the top of the mobile menu, shown to signed-out visitors only (up to 1000px the
// header has no room for the guest buttons). While the session is still loading, and once signed in, nothing is shown,
// so the signed-in menu is unchanged.
export function GuestMenuLinks() {
  const { status } = useAuth();
  if (status !== 'anonymous') return null;
  return (
    <>
      <Link href={routes.login}>{messages.site.header.login}</Link>
      <Link href={routes.register}>{messages.site.header.register}</Link>
    </>
  );
}
