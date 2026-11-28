'use client';

import Link from 'next/link';

import messages from '@/i18n/messages/ar.json';
import { formatNumber } from '@/shared/lib/format';
import { Icon } from '@/shared/ui/icon';
import { Select } from '@/shared/ui/input';
import { getPageItems } from '@/shared/ui/pagination';

import styles from './table-pagination.module.css';
import { PAGE_SIZE_OPTIONS } from './table-state';
import type { PaginationState } from './types';

const copy = messages.admin.table;

export type TablePaginationProps = {
  buildHref: (page: number) => string;
  onPageSizeChange: (pageSize: number) => void;
  pagination: PaginationState;
  rowsOnPage: number;
  // The page-size select is an extra of the shared kit; a design without it (AdmOrders) turns it off.
  showPageSize?: boolean;
};

function totalPagesOf({ hasNext, page, pageSize, total }: PaginationState): number {
  if (total !== null) return Math.max(1, Math.ceil(total / pageSize));

  return hasNext ? page + 1 : page;
}

function rangeText({ page, pageSize, total }: PaginationState, rowsOnPage: number): string | null {
  if (total === null || rowsOnPage === 0) return null;

  const from = (page - 1) * pageSize + 1;

  return copy.range
    .replace('{from}', formatNumber(from))
    .replace('{to}', formatNumber(from + rowsOnPage - 1))
    .replace('{total}', formatNumber(total));
}

function Step({ href, label, next }: { href: string | null; label: string; next?: boolean }) {
  const icon = <Icon name={next ? 'chev-l' : 'chev-r'} size="sm" />;

  if (href === null) {
    return (
      <span
        aria-disabled="true"
        aria-label={label}
        className={`${styles.link} ${styles.disabled}`}
        role="link"
      >
        {icon}
      </span>
    );
  }

  return (
    <Link aria-label={label} className={styles.link} href={href}>
      {icon}
    </Link>
  );
}

export function TablePagination({
  buildHref,
  onPageSizeChange,
  pagination,
  rowsOnPage,
  showPageSize = true,
}: TablePaginationProps) {
  const totalPages = totalPagesOf(pagination);
  const { page } = pagination;
  const summary = rangeText(pagination, rowsOnPage);

  return (
    <div className={styles.pagination}>
      <span className={styles.summary}>{summary}</span>
      <nav aria-label={copy.pagination} className={styles.pages}>
        <Step href={page > 1 ? buildHref(page - 1) : null} label={copy.previous} />
        {getPageItems(page, totalPages).map((item, index) =>
          item === 'ellipsis' ? (
            <span key={`gap-${index}`} aria-hidden="true" className={styles.gap}>
              …
            </span>
          ) : (
            <Link
              key={item}
              aria-current={item === page ? 'page' : undefined}
              className={`${styles.link} ${styles.item}`}
              href={buildHref(item)}
            >
              {formatNumber(item)}
            </Link>
          ),
        )}
        <Step
          href={pagination.hasNext || page < totalPages ? buildHref(page + 1) : null}
          label={copy.next}
          next
        />
      </nav>
      {showPageSize ? (
        <Select
          aria-label={copy.pageSize}
          className={styles.size}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          value={String(pagination.pageSize)}
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {copy.pageSizeOption.replace('{size}', formatNumber(size))}
            </option>
          ))}
        </Select>
      ) : null}
    </div>
  );
}
