'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

import messages from '@/i18n/messages/ar.json';
import { Button } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { Skeleton } from '@/shared/ui/skeleton';

import styles from './data-table.module.css';
import type { DataTableColumn } from './types';

const copy = messages.admin.table;

export type DataTableProps<Row> = {
  columns: readonly DataTableColumn<Row>[];
  getRowHref?: (row: Row) => string;
  getRowKey: (row: Row) => string;
  isError?: boolean;
  isFiltered?: boolean;
  isLoading?: boolean;
  onRetry?: () => void;
  rows: readonly Row[];
  // Rows drawn while loading: pass the page size so the skeleton has the height of the real page.
  skeletonRows?: number;
};

const DEFAULT_SKELETON_ROWS = 10;

function columnClass(column: DataTableColumn<unknown>): string {
  return [
    styles.cell,
    column.priority === 'low' && !column.isActions ? styles.low : '',
    column.isActions ? styles.actionsCell : '',
  ]
    .filter(Boolean)
    .join(' ');
}

function Head<Row>({ columns }: { columns: readonly DataTableColumn<Row>[] }) {
  return (
    <thead className={styles.head}>
      <tr>
        {columns.map((column) => (
          <th
            key={column.id}
            className={columnClass(column as DataTableColumn<unknown>)}
            scope="col"
          >
            {column.isActions ? (
              <span className={styles.srOnly}>{column.header || copy.actions}</span>
            ) : (
              column.header
            )}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function renderCell<Row>(
  column: DataTableColumn<Row>,
  row: Row,
  href: string | undefined,
): ReactNode {
  const content = column.cell(row);

  if (column.isActions) return <div className={styles.actions}>{content}</div>;
  if (column.isPrimary && href) {
    return (
      <Link className={styles.rowLink} href={href}>
        {content}
      </Link>
    );
  }

  return content;
}

export function DataTable<Row>({
  columns,
  getRowHref,
  getRowKey,
  isError = false,
  isFiltered = false,
  isLoading = false,
  onRetry,
  rows,
  skeletonRows = DEFAULT_SKELETON_ROWS,
}: DataTableProps<Row>) {
  if (isError) {
    return (
      <EmptyState
        action={
          onRetry ? (
            <Button onClick={onRetry} variant="outline">
              {copy.retry}
            </Button>
          ) : undefined
        }
        description={copy.errorDescription}
        icon="x"
        title={copy.errorTitle}
        variant="error"
      />
    );
  }

  if (!isLoading && rows.length === 0) {
    return (
      <EmptyState
        description={isFiltered ? copy.emptyFilteredDescription : copy.emptyDescription}
        icon="search"
        title={isFiltered ? copy.emptyFilteredTitle : copy.emptyTitle}
        variant={isFiltered ? 'search' : 'empty'}
      />
    );
  }

  return (
    <div className={styles.scroll}>
      <table
        aria-busy={isLoading || undefined}
        aria-label={isLoading ? copy.loadingLabel : copy.tableLabel}
        className={styles.table}
      >
        <Head columns={columns} />
        <tbody>
          {isLoading
            ? Array.from({ length: skeletonRows }, (_, index) => (
                <tr key={index} className={styles.row} data-skeleton-row="">
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      className={columnClass(column as DataTableColumn<unknown>)}
                      data-label={column.isActions ? '' : column.header}
                    >
                      <Skeleton size="sm" />
                    </td>
                  ))}
                </tr>
              ))
            : rows.map((row) => (
                <tr key={getRowKey(row)} className={styles.row}>
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      className={columnClass(column as DataTableColumn<unknown>)}
                      data-label={column.isActions ? '' : column.header}
                    >
                      {renderCell(column, row, getRowHref?.(row))}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}
