import { Fragment, type ReactNode } from 'react';

import messages from '@/i18n/messages/ar.json';
import type { AuthUser } from '@/modules/auth';

import styles from './account.module.css';
import { UnconfirmedEmailBanner } from './unconfirmed-email-banner';

// An email offers a line break only after "@" and after each "." (<wbr>), so it never splits in the middle of a part
// (Task 84: it used to break as "...example.co" / "m"). It is never shortened. A part that is longer than the line
// can still wrap after a hyphen or, as the very last resort, inside the word (overflow-wrap) so it cannot leave its card.
function EmailText({ email }: { email: string }) {
  const parts = email.split(/(?<=[@.])/);
  return (
    <bdi className={styles.email} dir="ltr">
      {parts.map((part, index) => (
        <Fragment key={`${part}-${index}`}>
          {part}
          {index < parts.length - 1 ? <wbr /> : null}
        </Fragment>
      ))}
    </bdi>
  );
}

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
            <EmailText email={user.email} />
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
