'use client';

import type { ReactNode } from 'react';
import messages from '@/i18n/messages/ar.json';
import { FeatureGate } from '@/shared/ui/soon';
import type { Order } from '../api/orders-api';
import { PaymentProofForm } from './payment-proof-form';

// What the customer sees about the transfer receipt of a ManualTransfer order:
// the upload form while a payment waits for it, a "received" note once it is under review. A rejected payment shows
// its reason in the payments list of the order details, and there is no second upload.
export function PaymentProofSection({
  order,
  onOrderChange,
}: {
  order: Order;
  onOrderChange: (order: Order) => void;
}) {
  if (order.paymentMethod !== 'ManualTransfer') return null;
  const isAwaitingProof =
    order.status === 'PendingPayment' &&
    order.payments.some((payment) => payment.status === 'Pending');
  const isUnderReview =
    order.status === 'PaymentReview' ||
    order.payments.some((payment) => payment.status === 'Submitted');
  let content: ReactNode = null;
  if (isAwaitingProof) content = <PaymentProofForm order={order} onSubmitted={onOrderChange} />;
  else if (isUnderReview) content = <p role="status">{messages.orders.proofReceived}</p>;
  if (!content) return null;

  return (
    <FeatureGate feature="payment-proof" label={messages.site.soon}>
      {content}
    </FeatureGate>
  );
}
