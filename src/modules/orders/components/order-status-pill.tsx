import messages from '@/i18n/messages/ar.json';

import type { OrderStatus } from '../api/orders-api';
import { orderTone } from '../lib/order-progress';
import styles from './order-status.module.css';

// The status of an order as a pill: the text is the API status, the tone (wait, ship, done, cancelled) follows it.
export function OrderStatusPill({
  status,
  isLarge = false,
}: {
  status: OrderStatus;
  isLarge?: boolean;
}) {
  const className = [styles.pill, styles[orderTone(status)], isLarge ? styles.large : '']
    .filter(Boolean)
    .join(' ');
  return <span className={className}>{messages.orders.status[status]}</span>;
}
