import Link from 'next/link';

import messages from '@/i18n/messages/ar.json';
import { formatDate, formatMoney, formatNumber } from '@/shared/lib/format';
import { Icon } from '@/shared/ui/icon';
import type { DataTableColumn } from '@/shared/ui/admin/data-table';
import { StatusPill } from '@/shared/ui/admin/status-pill';

import type { AdminOrderListItem } from '../api/admin-orders-api';
import styles from './admin-orders.module.css';

const copy = messages.admin.orders;

// The frame shows "12 أكتوبر": the year is left out for this year's orders and kept for older ones, so a list that
// reaches back past January stays unambiguous.
export function listDate(value: string, now: Date = new Date()): string {
  const full = formatDate(value);
  const suffix = ` ${now.getFullYear()}`;

  return full.endsWith(suffix) ? full.slice(0, -suffix.length) : full;
}

export function orderHref(order: Pick<AdminOrderListItem, 'orderId'>): string {
  return `/admin/orders/${order.orderId}`;
}

// The columns of design/AdmOrders.dc.html. Money comes from the API as sent. What the list endpoint has no data for
// is drawn but inert: the selection boxes (no bulk action), the payment status (a dash for every row) and the edit and
// delete buttons (no screen yet). Nothing is invented.
export const ORDER_COLUMNS: readonly DataTableColumn<AdminOrderListItem>[] = [
  {
    cell: () => (
      <input aria-label={copy.selectRow} className={styles.checkbox} disabled type="checkbox" />
    ),
    header: copy.columns.select,
    headerContent: (
      <input aria-label={copy.selectAll} className={styles.checkbox} disabled type="checkbox" />
    ),
    id: 'select',
    isSelection: true,
  },
  {
    cell: (order) => (
      <span className={styles.number} dir="ltr">
        #{order.orderNumber}
      </span>
    ),
    header: copy.columns.order,
    id: 'order',
    isPrimary: true,
  },
  { cell: (order) => order.recipientName, header: copy.columns.customer, id: 'customer' },
  {
    cell: (order) => formatNumber(order.itemsCount),
    header: copy.columns.books,
    id: 'books',
  },
  {
    cell: (order) => <b className={styles.nowrap}>{formatMoney(order.total)}</b>,
    header: copy.columns.total,
    id: 'total',
  },
  {
    cell: (order) => (
      <span className={styles.nowrap}>{copy.paymentMethods[order.paymentMethod]}</span>
    ),
    header: copy.columns.payment,
    id: 'payment',
  },
  {
    cell: () => <span className={styles.dashPill}>—</span>,
    header: copy.columns.paymentStatus,
    id: 'paymentStatus',
  },
  {
    cell: (order) => <StatusPill status={order.status} type="order" />,
    header: copy.columns.status,
    id: 'status',
  },
  {
    cell: (order) => <span className={styles.nowrap}>{listDate(order.createdAt)}</span>,
    header: copy.columns.date,
    id: 'date',
  },
  {
    cell: (order) => (
      <>
        <Link aria-label={copy.viewOrder} className={styles.iconButton} href={orderHref(order)}>
          <Icon name="eye" size="sm" />
        </Link>
        <button
          aria-label={copy.editOrder}
          className={styles.iconButton}
          disabled
          title={copy.soon}
          type="button"
        >
          <Icon name="settings" size="sm" />
        </button>
        <button
          aria-label={copy.deleteOrder}
          className={styles.iconButton}
          disabled
          title={copy.soon}
          type="button"
        >
          <Icon name="trash" size="sm" />
        </button>
      </>
    ),
    header: copy.columns.actions,
    id: 'actions',
    isActions: true,
  },
];
