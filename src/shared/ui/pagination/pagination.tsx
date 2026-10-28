import Link from 'next/link';

import { formatNumber } from '@/shared/lib/format';
import { Icon } from '@/shared/ui/icon';

import styles from './pagination.module.css';

export type PaginationProps = {
  buildHref: (page: number) => string;
  label: string;
  nextLabel: string;
  page: number;
  previousLabel: string;
  totalPages: number;
};

type PageItem = number | 'ellipsis';

// This remains a Server Component so Server callers can safely pass buildHref for URL search parameters.
export function Pagination({
  buildHref,
  label,
  nextLabel,
  page,
  previousLabel,
  totalPages,
}: PaginationProps) {
  const pageItems = getPageItems(page, totalPages);
  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav aria-label={label} className={styles.pagination}>
      {hasPrevious ? (
        <Link aria-label={previousLabel} className={styles.pageLink} href={buildHref(page - 1)}>
          <Icon name="arrow-r" size="sm" />
        </Link>
      ) : (
        <span
          aria-disabled="true"
          aria-label={previousLabel}
          className={`${styles.pageLink} ${styles.disabled}`}
          role="link"
        >
          <Icon name="arrow-r" size="sm" />
        </span>
      )}

      {pageItems.map((item, index) =>
        item === 'ellipsis' ? (
          <span key={`ellipsis-${index}`} aria-hidden="true" className={styles.ellipsis}>
            …
          </span>
        ) : (
          <Link
            key={item}
            aria-current={item === page ? 'page' : undefined}
            className={styles.pageLink}
            href={buildHref(item)}
          >
            {formatNumber(item)}
          </Link>
        ),
      )}

      {hasNext ? (
        <Link aria-label={nextLabel} className={styles.pageLink} href={buildHref(page + 1)}>
          <Icon name="arrow" size="sm" />
        </Link>
      ) : (
        <span
          aria-disabled="true"
          aria-label={nextLabel}
          className={`${styles.pageLink} ${styles.disabled}`}
          role="link"
        >
          <Icon name="arrow" size="sm" />
        </span>
      )}
    </nav>
  );
}

export function getPageItems(page: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (page <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis', totalPages];
  }

  if (page >= totalPages - 3) {
    return [
      1,
      'ellipsis',
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [1, 'ellipsis', page - 1, page, page + 1, 'ellipsis', totalPages];
}
