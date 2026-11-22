import Link from 'next/link';

import messages from '@/i18n/messages/ar.json';
import { orderRoute } from '@/shared/config/routes';
import { formatDate, formatMoney, formatNumber } from '@/shared/lib/format';
import { ButtonLink } from '@/shared/ui/button';

import type { OrderList } from '../api/orders-api';
import styles from './orders-list.module.css';
import { OrderStatusPill } from './order-status-pill';
import { OrderTracker } from './order-tracker';

type OrderListItem = OrderList['items'][number];

// One order of the list (design/Orders.dc.html .oc): number, date, item count and the status pill; the tracker; the total
// (the API's) and the link to the details. The list API has no items, payment method or notes, so none are shown.
export function OrderListCard({ item }: { item: OrderListItem }) {
  const text = messages.orders;
  return (
    <article className={styles.card}>
      <div className={styles.cardHead}>
        <dl className={styles.meta}>
          <div>
            <dt>{text.orderNumber}</dt>
            <dd dir="ltr">
              <Link href={orderRoute(item.id)}>#{item.orderNumber}</Link>
            </dd>
          </div>
          <div>
            <dt>{text.orderDate}</dt>
            <dd>
              <time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time>
            </dd>
          </div>
          <div>
            <dt>{text.booksCount}</dt>
            <dd>{text.booksCountValue.replace('{count}', formatNumber(item.itemsCount))}</dd>
          </div>
        </dl>
        <OrderStatusPill status={item.status} />
      </div>
      <div className={styles.cardBody}>
        <OrderTracker status={item.status} />
        {item.canCancel ? <p className={styles.note}>{text.canCancel}</p> : null}
      </div>
      <div className={styles.cardFoot}>
        <div className={styles.total}>
          <small>{text.totalWithShipping}</small>
          {formatMoney(item.total)}
        </div>
        <ButtonLink href={orderRoute(item.id)} size="sm" variant="outline">
          {text.details}
        </ButtonLink>
      </div>
    </article>
  );
}
