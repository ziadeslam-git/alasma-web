'use client';

import { useEffect, useState } from 'react';
import messages from '@/i18n/messages/ar.json';
import { UnconfirmedEmailBanner } from '@/modules/account';
import { ApiError, getApiErrorMessage } from '@/shared/lib/api';
import { formatDateTime, formatMoney, formatNumber } from '@/shared/lib/format';
import { EmptyState } from '@/shared/ui/empty-state';
import { Modal } from '@/shared/ui/modal';
import { Skeleton } from '@/shared/ui/skeleton';
import { FeatureGate } from '@/shared/ui/soon';
import { cancelOrder, getOrder, isOrderId, type Order } from '../api/orders-api';
import { OrderEditDialog } from './order-edit-dialog';
import styles from './orders.module.css';

export function OrderDetails({ id, fixture }: { id: string; fixture?: Order }) {
  const text = messages.orders;
  const [order, setOrder] = useState<Order | null>(fixture ?? null);
  const [isLoading, setLoading] = useState(!fixture && isOrderId(id));
  const [isMissing, setMissing] = useState(!isOrderId(id));
  const [error, setError] = useState<ApiError | null>(null);
  const [isConfirming, setConfirming] = useState(false);
  const [isEditing, setEditing] = useState(false);
  const [hasConflict, setConflict] = useState(false);
  const [isPending, setPending] = useState(false);
  useEffect(() => {
    if (fixture || !isOrderId(id)) return;
    let isActive = true;
    void getOrder(id)
      .then((result) => {
        if (isActive) setOrder(result);
      })
      .catch((cause: unknown) => {
        if (!isActive) return;
        if (cause instanceof ApiError && cause.status === 404) setMissing(true);
        else setError(cause instanceof ApiError ? cause : new ApiError({ kind: 'unknown' }));
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [id, fixture]);
  async function cancel() {
    setPending(true);
    setError(null);
    try {
      setOrder(await cancelOrder(id));
      setConfirming(false);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause : new ApiError({ kind: 'unknown' }));
    } finally {
      setPending(false);
    }
  }
  if (isLoading)
    return (
      <section>
        <h1>{text.details}</h1>
        <Skeleton shape="card" />
      </section>
    );
  if (isMissing)
    return (
      <section>
        <h1>{text.details}</h1>
        <EmptyState icon="book" title={text.notFound} description={text.notFoundDescription} />
      </section>
    );
  if (!order)
    return (
      <section>
        <h1>{text.details}</h1>
        {error?.code === 'email_not_confirmed' ? (
          <UnconfirmedEmailBanner />
        ) : (
          <p role="alert">{error ? getApiErrorMessage(error) : text.error}</p>
        )}
      </section>
    );
  return (
    <section className={styles.section}>
      <h1>{order.orderNumber}</h1>
      {hasConflict ? <p role="status">{text.changed}</p> : null}
      {error?.code === 'email_not_confirmed' ? (
        <UnconfirmedEmailBanner />
      ) : error ? (
        <p role="alert">{getApiErrorMessage(error)}</p>
      ) : null}
      <p>{text.status[order.status]}</p>
      {order.expiresAt && order.paymentMethod === 'ManualTransfer' ? (
        <p>{text.expires.replace('{date}', formatDateTime(order.expiresAt))}</p>
      ) : null}
      <section>
        <h2>{text.items}</h2>
        {order.items.map((item, index) => (
          <article className={styles.card} key={`${item.title}-${index}`}>
            <h3>{item.title}</h3>
            <p>
              {formatNumber(item.quantity)} · {formatMoney(item.lineTotal)}
            </p>
            {item.components.length ? (
              <ul>
                {item.components.map((part) => (
                  <li key={part.bookId}>
                    {part.title} · {formatNumber(part.quantity)}
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </section>
      <section>
        <h2>{text.address}</h2>
        <p>
          {order.address.recipientName} · {order.address.phone}
        </p>
        <p>
          {order.address.governorateName} · {order.address.city} · {order.address.addressLine}{' '}
          {order.address.landmark}
        </p>
      </section>
      <section>
        <h2>{text.pricing}</h2>
        <p>
          {text.subtotal}: {formatMoney(order.pricing.subtotal)}
        </p>
        <p>
          {text.discount}: {formatMoney(order.pricing.couponDiscount)}
        </p>
        <p>
          {text.shipping}: {formatMoney(order.pricing.shippingFee)}
        </p>
        <p>
          {text.total}: {formatMoney(order.pricing.total)}
        </p>
      </section>
      <section>
        <h2>{text.payments}</h2>
        {order.payments.map((payment) => (
          <p key={payment.id}>
            {text.paymentStatus[payment.status]} · {formatMoney(payment.amount)}
            {payment.submittedAt ? ` · ${formatDateTime(payment.submittedAt)}` : null}
            {payment.rejectionReason ? ` · ${payment.rejectionReason}` : null}
          </p>
        ))}
        <FeatureGate feature="payment-proof" label={messages.site.soon}>
          <span>{text.proof}</span>
        </FeatureGate>
      </section>
      <section>
        <h2>{text.shipment}</h2>
        {order.shipment ? (
          <p>
            {order.shipment.carrierName} {order.shipment.trackingNumber}
            {order.shipment.shippedAt ? ` · ${formatDateTime(order.shipment.shippedAt)}` : null}
            {order.shipment.deliveredAt ? ` · ${formatDateTime(order.shipment.deliveredAt)}` : null}
          </p>
        ) : (
          <p>{text.notShipped}</p>
        )}
      </section>
      <section>
        <h2>{text.timeline}</h2>
        {order.timeline.map((step, index) => (
          <p key={`${step.status}-${index}`}>
            {text.status[step.status]} {formatDateTime(step.at)}
          </p>
        ))}
      </section>
      {order.canEdit ? (
        <button
          onClick={() => {
            setConflict(false);
            setEditing(true);
          }}
          type="button"
        >
          {text.edit}
        </button>
      ) : null}
      {isEditing ? (
        <OrderEditDialog
          order={order}
          onClose={() => setEditing(false)}
          onSaved={setOrder}
          onConflict={async () => {
            setOrder(await getOrder(id));
            setConflict(true);
          }}
        />
      ) : null}
      {order.canCancel ? (
        <button onClick={() => setConfirming(true)} type="button">
          {text.cancel}
        </button>
      ) : null}
      <FeatureGate feature="order-invoice" label={messages.site.soon}>
        <span>{text.invoice}</span>
      </FeatureGate>
      <Modal
        closeLabel={text.close}
        onOpenChange={setConfirming}
        open={isConfirming}
        title={text.confirmCancel}
      >
        <button disabled={isPending} onClick={() => void cancel()} type="button">
          {text.cancel}
        </button>
        <button disabled={isPending} onClick={() => setConfirming(false)} type="button">
          {text.close}
        </button>
      </Modal>
    </section>
  );
}
