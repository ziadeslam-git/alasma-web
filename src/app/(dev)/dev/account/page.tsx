import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import messages from '@/i18n/messages/ar.json';
import { AccountProfile, AccountShell } from '@/modules/account';
import type { AuthUser } from '@/modules/auth';

export const metadata: Metadata = {
  title: 'Account (dev)',
  robots: { index: false, follow: false },
};

export default async function AccountDevPage({
  searchParams,
}: { searchParams?: Promise<Record<string, string | string[] | undefined>> } = {}) {
  if (process.env.NODE_ENV === 'production') notFound();
  const state = (await searchParams)?.state;
  const user: AuthUser = {
    id: 1,
    fullName:
      state === 'long'
        ? Array(6).fill(messages.devHome.categories.novels).join(' ')
        : messages.devHome.categories.novels,
    email: 'reader@example.com',
    emailConfirmed: state !== 'unconfirmed',
    phone: null,
    preferredLanguage: 'ar',
    roles: [],
    permissions: [],
    features: [],
  };
  return (
    <AccountShell>
      <AccountProfile user={user} />
    </AccountShell>
  );
}
