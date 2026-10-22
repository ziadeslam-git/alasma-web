import messages from '@/i18n/messages/ar.json';
import { EmptyState } from '@/shared/ui/empty-state';
import { Skeleton } from '@/shared/ui/skeleton';

import type { BookCardItem } from '../types';
import { BookCard } from './book-card';
import styles from './book-grid.module.css';

export const DEFAULT_SKELETON_COUNT = 8;

export type BookGridProps = {
  emptyDescription?: string;
  emptyTitle?: string;
  isLoading?: boolean;
  items: readonly BookCardItem[];
  skeletonCount?: number;
};

export function BookGrid({
  emptyDescription = messages.catalog.emptyDescription,
  emptyTitle = messages.catalog.emptyTitle,
  isLoading = false,
  items,
  skeletonCount = DEFAULT_SKELETON_COUNT,
}: BookGridProps) {
  if (isLoading) {
    return (
      <div
        aria-busy="true"
        aria-label={messages.catalog.loadingLabel}
        className={styles.grid}
        role="status"
      >
        {Array.from({ length: skeletonCount }, (_, index) => (
          <div key={index} aria-hidden="true" className={styles.skeletonCard}>
            <div className={styles.skeletonFigure}>
              <Skeleton className={styles.skeletonCover} shape="block" />
              <div className={styles.skeletonActions}>
                <Skeleton className={styles.skeletonActionCircle} shape="circle" size="sm" />
                <Skeleton className={styles.skeletonActionCircle} shape="circle" size="sm" />
              </div>
            </div>
            <div className={styles.skeletonBody}>
              <Skeleton shape="line" size="sm" />
              <Skeleton shape="line" size="lg" />
              <Skeleton shape="line" size="sm" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return <EmptyState description={emptyDescription} icon="book" title={emptyTitle} />;
  }

  return (
    <div className={styles.grid}>
      {items.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
}
