'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/modules/auth';
import { clearAttempt } from './attempt-storage';

export function AttemptSessionObserver() {
  const { status, user } = useAuth();
  const previousUser = useRef<number | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    const currentUser = user?.id ?? null;
    if (
      currentUser === null ||
      (previousUser.current !== null && previousUser.current !== currentUser)
    ) {
      clearAttempt();
    }
    previousUser.current = currentUser;
  }, [status, user?.id]);
  return null;
}
