import Link from 'next/link';

import { BookCard, type BookCardItem } from '@/modules/catalog';
import { EmptyState } from '@/shared/ui/empty-state';
import { Icon } from '@/shared/ui/icon';

import type { HomeSectionResult } from '../types';
import styles from './home-books-shelf.module.css';

export type HomeBooksShelfProps = {
  emptyDescription: string;
  emptyTitle: string;
  heading: string;
  headingId: string;
  prioritizeFirstCover?: boolean;
  result: HomeSectionResult<BookCardItem>;
  subtitle: string;
  viewAllHref: string;
  viewAllLabel: string;
};

// REAL book shelf (used for both GET /books/new-arrivals and GET /books/featured).
// Uses CSS grid on desktop/tablet and CSS scroll-snap horizontal swipe on mobile (<= 760px), with zero JS.
export function HomeBooksShelf({
  emptyDescription,
  emptyTitle,
  heading,
  headingId,
  prioritizeFirstCover = false,
  result,
  subtitle,
  viewAllHref,
  viewAllLabel,
}: HomeBooksShelfProps) {
  return (
    <section aria-labelledby={headingId} className={styles.section}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h2 className={styles.heading} id={headingId}>
            {heading}
          </h2>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
        <Link className={styles.viewAll} href={viewAllHref}>
          <span>{viewAllLabel}</span>
          <Icon name="arrow" size="sm" />
        </Link>
      </div>

      {result.status === 'ok' ? (
        <div className={styles.shelf}>
          {result.items.map((book, index) => (
            <div className={styles.item} key={book.id}>
              <BookCard book={book} priority={prioritizeFirstCover && index === 0} />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          description={emptyDescription}
          headingLevel={3}
          icon="book"
          title={emptyTitle}
        />
      )}
    </section>
  );
}
