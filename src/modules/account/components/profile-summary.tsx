import type { AuthUser } from '@/modules/auth';

import styles from './profile.module.css';

// The identity card at the top of the profile page (design/Profile.dc.html .idc): the initial avatar with the gold
// feather badge, the name and the email. The badge is decorative (changing the photo has no API); "member since" and
// the orders count of the design have no field in GET /me, so the email takes the second line.
export function ProfileSummary({ user }: { user: AuthUser }) {
  const initial = [...user.fullName.trim()][0] ?? '';

  return (
    <section className={styles.summary}>
      <span aria-hidden="true" className={styles.avatar}>
        {initial}
        <span className={styles.avatarBadge}>
          <span className={styles.feather} />
        </span>
      </span>
      <div className={styles.summaryBody}>
        <strong className={styles.summaryName}>{user.fullName}</strong>
        <bdi className={styles.summaryEmail} dir="ltr">
          {user.email}
        </bdi>
      </div>
    </section>
  );
}
