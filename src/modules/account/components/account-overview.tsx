'use client';

import messages from '@/i18n/messages/ar.json';
import { useAuth } from '@/modules/auth';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

import { AccountProfile } from './account-profile';

export function AccountOverview() {
  const { user, logout } = useAuth();
  if (!user) return <Skeleton shape="card" />;
  return (
    <AccountProfile user={user}>
      <Button onClick={() => void logout()}>{messages.account.logout}</Button>
    </AccountProfile>
  );
}
