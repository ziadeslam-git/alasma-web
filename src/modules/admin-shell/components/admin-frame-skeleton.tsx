import messages from '@/i18n/messages/ar.json';
import { Skeleton } from '@/shared/ui/skeleton';

import styles from './admin-shell.module.css';

// What shows while the session loads (and while an anonymous visitor is sent to the login): the frame's boxes, so the
// real frame replaces it without a flash or a jump. No user data is read here.
export function AdminFrameSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label={messages.admin.shell.loading}
      className={styles.page}
      data-admin-state="loading"
      role="status"
    >
      <div className={styles.frame}>
        <Skeleton className={styles.skeletonTop} shape="block" />
        <Skeleton className={styles.skeletonMain} shape="block" />
      </div>
    </div>
  );
}
