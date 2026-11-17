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
      {/* Task 73: every row is one label/value pair with the same alignment. LTR values (email, phone) are isolated in a
          <bdi> so their direction does not flip the row's alignment to the physical left. */}
      <dl className={styles.details}>
        <div className={styles.row}>
          <dt>{text.name}</dt>
          <dd>{user.fullName}</dd>
        </div>
        <div className={styles.row}>
          <dt>{text.email}</dt>
          <dd>
            <bdi dir="ltr">{user.email}</bdi>
            {user.emailConfirmed ? (
              <span className={styles.badge} title={text.confirmed}>
                {text.confirmedBadge}
              </span>
            ) : null}
          </dd>
        </div>
        <div className={styles.row}>
          <dt>{text.phone}</dt>
          <dd>{user.phone ? <bdi dir="ltr">{user.phone}</bdi> : text.noPhone}</dd>
        </div>
      </dl>
      {children ? <div className={styles.profileActions}>{children}</div> : null}
    </section>
  );
}
