'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { useAuth } from '@/modules/auth';
import { routes } from '@/shared/config/routes';

import { isStaff } from '../permissions';
import styles from './admin-shell.module.css';
import { AdminFrameSkeleton } from './admin-frame-skeleton';
import { AdminShell } from './admin-shell';
import { ForbiddenState } from './forbidden-state';

// The one guard of the whole /admin area. No session: to the login with ?next= (the skeleton of the frame shows
// meanwhile). Signed in but not staff (a Customer): the 403 screen, no frame and no admin data. Staff: the frame.
// Pages then ask for their own permission with RequirePermission.
export function AdminGate({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status === 'anonymous') {
      router.replace(`${routes.login}?next=${encodeURIComponent(pathname || routes.admin)}`);
    }
  }, [pathname, router, status]);

  if (status !== 'authenticated' || !user) {
    return <AdminFrameSkeleton />;
  }

  if (!isStaff(user.roles)) {
    return (
      <div className={styles.standalone}>
        <main id="main">
          <ForbiddenState />
        </main>
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
