import { Skeleton } from '@/shared/ui/skeleton';

import styles from './book-details-skeleton.module.css';

export function BookDetailsSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className={styles.container}>
      <Skeleton shape="line" />

      <div className={styles.hero}>
        <div className={styles.coverPlaceholder}>
          <Skeleton shape="card" />
        </div>

        <div className={styles.infoColumn}>
          <Skeleton shape="line" />
          <Skeleton shape="line" />
          <Skeleton shape="block" />
          <Skeleton shape="block" />
        </div>
      </div>
    </div>
  );
}
