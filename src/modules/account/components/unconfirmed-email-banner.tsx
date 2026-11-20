'use client';

import messages from '@/i18n/messages/ar.json';
import { ResendConfirmation, useAuth } from '@/modules/auth';
import { FeatureGate } from '@/shared/ui/soon';

import styles from './account.module.css';

// The "confirm your email" notice. With resend-confirmation live it offers a working resend action to the signed-in
// user's own address (it is only shown to signed-in users: every page that uses it is behind the account session).
export function UnconfirmedEmailBanner() {
  const { user } = useAuth();

  return (
    <section className={styles.notice} aria-label={messages.account.unconfirmed}>
      <p>{messages.account.unconfirmed}</p>
      {user ? (
        <FeatureGate
          badge="inline"
          feature="resend-confirmation"
          label={messages.site.soon}
          whenSoon="hide"
        >
          <ResendConfirmation email={user.email} />
        </FeatureGate>
      ) : null}
    </section>
  );
}
