import type { ReactNode } from 'react';

import messages from '@/i18n/messages/ar.json';
import type { AuthUser } from '@/modules/auth';

import styles from './account.module.css';
import { UnconfirmedEmailBanner } from './unconfirmed-email-banner';

export function AccountProfile({ user, children }: { user: AuthUser; children?: ReactNode }) {
  const text = messages.account;
  return (
    <section className={styles.profile}>
      <h1>{text.overview}</h1>
      {!user.emailConfirmed ? <UnconfirmedEmailBanner /> : null}
      <dl className={styles.details}>
        <div>
          <dt>{text.name}</dt>
          <dd>{user.fullName}</dd>
        </div>
        <div>
          <dt>{text.email}</dt>
          <dd dir="ltr">{user.email}</dd>
        </div>
        <div>
          <dt>{text.phone}</dt>
          <dd dir="ltr">{user.phone ?? text.noPhone}</dd>
        </div>
      </dl>
      {user.emailConfirmed ? <p>{text.confirmed}</p> : null}
      {children}
    </section>
  );
}
