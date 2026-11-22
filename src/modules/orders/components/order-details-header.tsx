import Link from 'next/link';

import messages from '@/i18n/messages/ar.json';
import { routes } from '@/shared/config/routes';
import { formatDate } from '@/shared/lib/format';
import { Icon } from '@/shared/ui/icon';

import type { Order } from '../api/orders-api';
import styles from './order-details.module.css';
import { OrderInvoiceButton } from './order-invoice-button';
import { OrderStatusPill } from './order-status-pill';

// Header of design/OrderDetail.dc.html: link back, "طلب #number", the date, and the invoice button beside the status pill.
export function OrderDetailsHeader({ order }: { order: Order }) {
  const text = messages.orders;
  return (
    <header className={styles.head}>
      <div>
        <Link className={styles.back} href={routes.accountOrders}>
          <Icon name="arrow-r" size="sm" />
          {text.title}
        </Link>
        <h1 className={styles.title}>
          {text.orderPrefix} <span dir="ltr">#{order.orderNumber}</span>
        </h1>
        <p className={styles.date}>
          <time dateTime={order.createdAt}>{formatDate(order.createdAt)}</time>
        </p>
      </div>
      <div className={styles.headActions}>
        <OrderInvoiceButton orderId={order.id} status={order.status} />
        <OrderStatusPill isLarge status={order.status} />
      </div>
    </header>
  );
}
