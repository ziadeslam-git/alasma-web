'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { routes } from '@/shared/config/routes';
import { Skeleton } from '@/shared/ui/skeleton';
import { useAuth } from '../hooks/use-auth';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    if (status === 'anonymous')
      router.replace(`${routes.login}?next=${encodeURIComponent(pathname || routes.home)}`);
  }, [pathname, router, status]);
  return status === 'authenticated' ? children : <Skeleton shape="card" />;
}
