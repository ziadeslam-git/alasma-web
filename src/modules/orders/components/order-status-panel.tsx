'use client';

import { useState } from 'react';

import messages from '@/i18n/messages/ar.json';
import { formatDate, formatDateTime } from '@/shared/lib/format';
import { Icon } from '@/shared/ui/icon';

import type { Order } from '../api/orders-api';
import styles from './order-details.module.css';
import { OrderTracker } from './order-tracker';

// "حالة الطلب": the tracker, the shipping or expiry note, and the dated steps the API reports.
export function OrderStatusPanel({ order }: { order: Order }) {
  const text = messages.orders;
  const shipment = order.shipment;
  // Same comparison as the proof section (no computed remaining time): a past expiresAt on a still unpaid order reads
  // as expired; the API stays the judge.
  const [now] = useState(() => Date.now());
  const hasExpiry = Boolean(order.expiresAt) && order.paymentMethod === 'ManualTransfer';
  return (
    <section aria-labelledby="order-status-heading" className={styles.panel}>
      <h2 id="order-status-heading">{text.timeline}</h2>
      <OrderTracker status={order.status} />
      {shipment ? (
        <p className={`${styles.note} ${styles.noteGreen}`}>
          <Icon name="truck" size="sm" />
          <span>
            <b>{text.shippingNote}</b> {shipment.carrierName}
            {shipment.trackingNumber ? (
              <>
                {' · '}
                {text.trackingNumber} <b dir="ltr">{shipment.trackingNumber}</b>
              </>
            ) : null}
            {shipment.shippedAt
              ? ` · ${text.shippedAt.replace('{date}', formatDate(shipment.shippedAt))}`
              : null}
            {shipment.deliveredAt
              ? ` · ${text.deliveredAt.replace('{date}', formatDate(shipment.deliveredAt))}`
              : null}
          </span>
        </p>
      ) : order.status !== 'Cancelled' ? (
        <p className={styles.mutedLine}>{text.notShipped}</p>
      ) : null}
      {hasExpiry && order.expiresAt ? (
        <p className={styles.note}>
          <Icon name="calendar" size="sm" />
          <span>
            {(order.status === 'PendingPayment' && new Date(order.expiresAt).getTime() <= now
              ? text.expired
              : text.expires
            ).replace('{date}', formatDateTime(order.expiresAt))}
          </span>
        </p>
      ) : null}
      {order.timeline.length > 0 ? (
        <ul className={styles.timeline}>
          {order.timeline.map((step, index) => (
            <li key={`${step.status}-${index}`}>
              {text.status[step.status]} {formatDateTime(step.at)}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
