import Link from 'next/link';

import messages from '@/i18n/messages/ar.json';
import { formatDate, formatMoney, formatNumber } from '@/shared/lib/format';
import { Icon } from '@/shared/ui/icon';
import type { DataTableColumn } from '@/shared/ui/admin/data-table';
import { StatusPill } from '@/shared/ui/admin/status-pill';

import type { AdminOrderListItem } from '../api/admin-orders-api';
import styles from './admin-orders.module.css';

const copy = messages.admin.orders;

export function orderHref(order: Pick<AdminOrderListItem, 'orderId'>): string {
  return `/admin/orders/${order.orderId}`;
}

// The columns of design/AdmOrders.dc.html that the list endpoint has data for. Money comes from the API as sent.
export const ORDER_COLUMNS: readonly DataTableColumn<AdminOrderListItem>[] = [
  {
    cell: (order) => (
      <span className={styles.number} dir="ltr">
        {order.orderNumber}
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
    cell: (order) => <b>{formatMoney(order.total)}</b>,
    header: copy.columns.total,
    id: 'total',
  },
  {
    cell: (order) => copy.paymentMethods[order.paymentMethod],
    header: copy.columns.payment,
    id: 'payment',
  },
  {
    cell: (order) => <StatusPill status={order.status} type="order" />,
    header: copy.columns.status,
    id: 'status',
  },
  {
    cell: (order) => formatDate(order.createdAt),
    header: copy.columns.date,
    id: 'date',
  },
  {
    cell: (order) => (
      <Link aria-label={copy.viewOrder} className={styles.viewLink} href={orderHref(order)}>
        <Icon name="eye" size="sm" />
      </Link>
    ),
    header: copy.columns.actions,
    id: 'actions',
    isActions: true,
  },
];
