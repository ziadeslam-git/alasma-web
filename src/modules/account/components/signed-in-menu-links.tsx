'use client';

import messages from '@/i18n/messages/ar.json';
import { useAuth } from '@/modules/auth';
import { routes } from '@/shared/config/routes';
import { FeatureLink } from '@/shared/ui/soon';

// The account entry of the mobile menu, for signed-in visitors only (Task 84: it used to show for guests too, who have
// no account to open and already get login and register at the top). Nothing while the session is loading.
export function SignedInMenuLinks() {
  const { status } = useAuth();
  if (status !== 'authenticated') return null;
  return (
    <FeatureLink feature="account-area" href={routes.account} label={messages.site.soon}>
      {messages.account.title}
    </FeatureLink>
  );
}
