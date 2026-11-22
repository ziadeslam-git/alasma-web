'use client';

import { useState, type ReactNode } from 'react';
import messages from '@/i18n/messages/ar.json';
import { FeatureGate } from '@/shared/ui/soon';
import type { Order } from '../api/orders-api';
import { PaymentProofForm } from './payment-proof-form';
import styles from './payment-proof.module.css';

// What the customer sees about the transfer receipt of a ManualTransfer order: the upload form while a payment waits
// for it (also after a rejection: the API opens a new Pending payment and returns the order to PendingPayment, Task 99),
// with the latest rejection reason above it; a "received" note once it is under review. The form is not offered once
// the API's expiresAt has passed; a 422 from the API stays the last guard.
export function PaymentProofSection({
  order,
  onOrderChange,
}: {
  order: Order;
  onOrderChange: (order: Order) => void;
}) {
  // The clock is read once when the section mounts (a comparison only; the API's 422 is the final judge).
  const [now] = useState(() => Date.now());
  if (order.paymentMethod !== 'ManualTransfer') return null;
  const isExpired = order.expiresAt !== null && new Date(order.expiresAt).getTime() <= now;
  const isAwaitingProof =
    order.status === 'PendingPayment' &&
    !isExpired &&
    order.payments.some((payment) => payment.status === 'Pending');
  const rejection = order.payments.findLast(
    (payment) => payment.status === 'Rejected' && payment.rejectionReason,
  );
  const isUnderReview =
    order.status === 'PaymentReview' ||
    order.payments.some((payment) => payment.status === 'Submitted');
  let content: ReactNode = null;
  if (isAwaitingProof) {
    content = (
      <>
        {rejection ? (
          <div className={styles.rejection} role="status">
            <strong>{messages.orders.proofRejectedTitle}</strong>
            <p>
              {messages.orders.proofRejectedReason.replace(
                '{reason}',
                rejection.rejectionReason ?? '',
              )}
            </p>
            <p>{messages.orders.proofRejectedHint}</p>
          </div>
        ) : null}
        <PaymentProofForm order={order} onSubmitted={onOrderChange} />
      </>
    );
  } else if (isUnderReview) content = <p role="status">{messages.orders.proofReceived}</p>;
  if (!content) return null;

  return (
    <FeatureGate feature="payment-proof" label={messages.site.soon}>
      {content}
    </FeatureGate>
  );
}
