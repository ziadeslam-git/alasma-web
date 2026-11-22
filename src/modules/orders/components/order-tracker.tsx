import messages from '@/i18n/messages/ar.json';

import type { OrderStatus } from '../api/orders-api';
import { reachedSteps, TRACKER_STEPS } from '../lib/order-progress';
import styles from './order-status.module.css';

// Four bars: the steps reached are filled; a cancelled order draws all four in the danger tone.
export function OrderTracker({ status }: { status: OrderStatus }) {
  const text = messages.orders;
  const reached = reachedSteps(status);
  const isCancelled = status === 'Cancelled';
  return (
    <ol aria-label={text.trackerLabel} className={styles.tracker}>
      {TRACKER_STEPS.map((step, index) => {
        const className = [
          styles.step,
          index < reached ? styles.stepOn : '',
          isCancelled ? styles.stepCancelled : '',
        ]
          .filter(Boolean)
          .join(' ');
        return (
          <li
            aria-current={index === reached - 1 ? 'step' : undefined}
            className={className}
            key={step}
          >
            {text[step]}
          </li>
        );
      })}
    </ol>
  );
}
