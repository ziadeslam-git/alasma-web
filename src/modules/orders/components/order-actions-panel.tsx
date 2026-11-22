'use client';

import messages from '@/i18n/messages/ar.json';
import { routes } from '@/shared/config/routes';
import { Button, ButtonLink } from '@/shared/ui/button';

import type { Order } from '../api/orders-api';
import styles from './order-details.module.css';

// "إجراءات": edit and cancel while the API allows them (canEdit / canCancel), a hint when it does not, and a new order.
export function OrderActionsPanel({
  order,
  onEdit,
  onCancel,
}: {
  order: Order;
  onEdit: () => void;
  onCancel: () => void;
}) {
  const text = messages.orders;
  const canChange = order.canEdit || order.canCancel;
  return (
    <section aria-labelledby="order-actions-heading" className={styles.panel}>
      <h2 id="order-actions-heading">{text.actionsTitle}</h2>
      <div className={styles.actions}>
        {order.canEdit ? (
          <Button fullWidth onClick={onEdit} variant="outline">
            {text.edit}
          </Button>
        ) : null}
        {order.canCancel ? (
          <Button className={styles.danger} fullWidth onClick={onCancel} variant="outline">
            {text.cancel}
          </Button>
        ) : null}
        {!canChange ? <p className={styles.hint}>{text.actionsHint}</p> : null}
        <ButtonLink fullWidth href={routes.books} leadingIcon="plus">
          {text.newOrder}
        </ButtonLink>
      </div>
    </section>
  );
}
