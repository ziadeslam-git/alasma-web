'use client';

import messages from '@/i18n/messages/ar.json';
import { formatDateTime, formatMoney } from '@/shared/lib/format';
import { FeatureGate } from '@/shared/ui/soon';

import type { Order } from '../api/orders-api';
import styles from './order-details.module.css';
import { PaymentProofSection } from './payment-proof-section';
import { PaymentReceiptButton } from './payment-receipt-button';

// "ملخص الدفع": the amounts, the method and the payments the API reports, with the receipt and the proof upload.
// Every figure is the API's; nothing is added up here.
export function OrderPaymentPanel({
  order,
  onOrderChange,
}: {
  order: Order;
  onOrderChange: (order: Order) => void;
}) {
  const text = messages.orders;
  const { pricing } = order;
  return (
    <section aria-labelledby="order-payment-heading" className={styles.panel}>
      <h2 id="order-payment-heading">{text.paymentSummary}</h2>
      <dl className={styles.kv}>
        <div>
          <dt>{text.subtotal}</dt>
          <dd>{formatMoney(pricing.subtotal)}</dd>
        </div>
        {pricing.couponDiscount > 0 ? (
          <div>
            <dt>{text.discount}</dt>
            <dd>{formatMoney(pricing.couponDiscount)}</dd>
          </div>
        ) : null}
        <div>
          <dt>{text.shippingTo.replace('{zone}', order.address.governorateName)}</dt>
          <dd>{formatMoney(pricing.shippingFee)}</dd>
        </div>
        <div className={styles.kvTotal}>
          <dt>{text.total}</dt>
          <dd>{formatMoney(pricing.total)}</dd>
        </div>
        <div>
          <dt>{text.paymentMethod}</dt>
          <dd>{text.paymentMethods[order.paymentMethod]}</dd>
        </div>
      </dl>
      {order.payments.length > 0 ? (
        <>
          <h3 className={styles.subheading}>{text.payments}</h3>
          <ul className={styles.payments}>
            {order.payments.map((payment) => (
              <li key={payment.id}>
                <span>
                  {text.paymentStatus[payment.status]} · {formatMoney(payment.amount)}
                  {payment.submittedAt ? ` · ${formatDateTime(payment.submittedAt)}` : null}
                  {payment.rejectionReason ? ` · ${payment.rejectionReason}` : null}
                </span>
                {payment.status === 'Approved' ? (
                  <FeatureGate feature="payment-receipt" label={messages.site.soon}>
                    <PaymentReceiptButton orderId={order.id} paymentId={payment.id} />
                  </FeatureGate>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      ) : null}
      <PaymentProofSection onOrderChange={onOrderChange} order={order} />
    </section>
  );
}
