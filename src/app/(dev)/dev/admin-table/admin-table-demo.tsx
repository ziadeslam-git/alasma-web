'use client';

import messages from '@/i18n/messages/ar.json';
import { formatDate, formatMoney } from '@/shared/lib/format';
import {
  DataTable,
  FilterBar,
  TablePagination,
  useTableUrlState,
  type DataTableColumn,
  type FilterDef,
} from '@/shared/ui/admin/data-table';

import styles from './admin-table-demo.module.css';

export type DemoState = 'empty' | 'error' | 'loading' | 'ready';

const copy = messages.devAdminTable;

type StatusKey = keyof typeof copy.statuses;
type DemoOrder = {
  count: number;
  createdAt: string;
  customer: string;
  id: string;
  method: string;
  number: string;
  status: StatusKey;
  total: number;
};

const ORDER_DATA: readonly Pick<
  DemoOrder,
  'count' | 'createdAt' | 'number' | 'status' | 'total'
>[] = [
  {
    count: 3,
    createdAt: '2026-10-12T09:00:00Z',
    number: 'AS-20418',
    status: 'PendingPayment',
    total: 412,
  },
  {
    count: 2,
    createdAt: '2026-10-10T09:00:00Z',
    number: 'AS-20397',
    status: 'Shipped',
    total: 265,
  },
  {
    count: 1,
    createdAt: '2026-10-10T08:00:00Z',
    number: 'AS-20390',
    status: 'Preparing',
    total: 120,
  },
  {
    count: 1,
    createdAt: '2026-09-28T09:00:00Z',
    number: 'AS-20311',
    status: 'Delivered',
    total: 155,
  },
  {
    count: 1,
    createdAt: '2026-09-15T09:00:00Z',
    number: 'AS-20266',
    status: 'Cancelled',
    total: 148,
  },
];

const ROWS: readonly DemoOrder[] = ORDER_DATA.map((order, index) => ({
  ...order,
  customer: copy.customers[index] ?? '',
  id: String(index + 1),
  method: copy.methods[index] ?? '',
}));

const TOTAL = 312;
const STATUS_KEYS = Object.keys(copy.statuses) as StatusKey[];
const BADGE: Record<StatusKey, string> = {
  Cancelled: styles.bad ?? '',
  Confirmed: styles.good ?? '',
  Delivered: styles.good ?? '',
  PaymentReview: styles.wait ?? '',
  PendingPayment: styles.wait ?? '',
  Preparing: styles.wait ?? '',
  Shipped: styles.info ?? '',
};

const FILTERS: readonly FilterDef[] = [
  { key: 'q', label: copy.searchLabel, placeholder: copy.searchPlaceholder, type: 'text' },
  {
    key: 'status',
    label: copy.statusLabel,
    options: STATUS_KEYS.map((value) => ({ label: copy.statuses[value], value })),
    type: 'status',
  },
  { fromKey: 'from', label: copy.periodLabel, maxDays: 366, toKey: 'to', type: 'dateRange' },
];

const COLUMNS: readonly DataTableColumn<DemoOrder>[] = [
  {
    cell: (row) => <span dir="ltr">#{row.number}</span>,
    header: copy.columns.order,
    id: 'number',
    isPrimary: true,
  },
  { cell: (row) => row.customer, header: copy.columns.customer, id: 'customer' },
  { cell: (row) => row.count, header: copy.columns.books, id: 'count', priority: 'low' },
  { cell: (row) => <b>{formatMoney(row.total)}</b>, header: copy.columns.total, id: 'total' },
  { cell: (row) => row.method, header: copy.columns.method, id: 'method', priority: 'low' },
  {
    cell: (row) => (
      <span className={`${styles.badge} ${BADGE[row.status]}`}>{copy.statuses[row.status]}</span>
    ),
    header: copy.columns.status,
    id: 'status',
  },
  {
    cell: (row) => formatDate(row.createdAt),
    header: copy.columns.date,
    id: 'date',
    priority: 'low',
  },
  {
    cell: () => <span className={styles.hint}>{messages.admin.table.actions}</span>,
    header: '',
    id: 'actions',
    isActions: true,
  },
];

export function AdminTableDemo({ state }: { state: DemoState }) {
  const table = useTableUrlState(FILTERS, 10);
  const rows = state === 'empty' ? [] : ROWS;
  const { page, pageSize } = table.state;

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>{copy.title}</h1>
      <div className={styles.panel}>
        <FilterBar filters={FILTERS} onChange={table.setFilters} values={table.state.values} />
        <DataTable
          columns={COLUMNS}
          getRowHref={(row) => `/dev/admin-table?order=${row.id}`}
          getRowKey={(row) => row.id}
          isError={state === 'error'}
          isFiltered={table.isFiltered}
          isLoading={state === 'loading'}
          onRetry={() => table.setFilters({})}
          rows={rows}
          skeletonRows={pageSize}
        />
        {state === 'ready' ? (
          <TablePagination
            buildHref={table.buildHref}
            onPageSizeChange={table.setPageSize}
            pagination={{ hasNext: page * pageSize < TOTAL, page, pageSize, total: TOTAL }}
            rowsOnPage={rows.length}
          />
        ) : null}
      </div>
    </main>
  );
}
