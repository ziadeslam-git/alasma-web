'use client';

import { useEffect, useState } from 'react';
import messages from '@/i18n/messages/ar.json';
import { UnconfirmedEmailBanner } from '@/modules/account';
import { ApiError, getApiErrorMessage } from '@/shared/lib/api';
import { Button } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { Modal } from '@/shared/ui/modal';
import { Skeleton } from '@/shared/ui/skeleton';
import { cancelOrder, getOrder, isOrderId, type Order } from '../api/orders-api';
import { OrderActionsPanel } from './order-actions-panel';
import { OrderAddressPanel } from './order-address-panel';
import { OrderDetailsHeader } from './order-details-header';
import { OrderEditDialog } from './order-edit-dialog';
import { OrderItemsPanel } from './order-items-panel';
import { OrderPaymentPanel } from './order-payment-panel';
import { OrderStatusPanel } from './order-status-panel';
import styles from './order-details.module.css';

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
      <section className={styles.page}>
        <h1 className={styles.title}>{text.details}</h1>
        <Skeleton shape="card" />
      </section>
    );
  if (isMissing)
    return (
      <section className={styles.page}>
        <h1 className={styles.title}>{text.details}</h1>
        <EmptyState icon="book" title={text.notFound} description={text.notFoundDescription} />
      </section>
    );
  if (!order)
    return (
      <section className={styles.page}>
        <h1 className={styles.title}>{text.details}</h1>
        {error?.code === 'email_not_confirmed' ? (
          <UnconfirmedEmailBanner />
        ) : (
          <p className={styles.alert} role="alert">
            {error ? getApiErrorMessage(error) : text.error}
          </p>
        )}
      </section>
    );
  return (
    <section className={styles.page}>
      <OrderDetailsHeader order={order} />
      {hasConflict ? (
        <p className={styles.notice} role="status">
          {text.changed}
        </p>
      ) : null}
      {error?.code === 'email_not_confirmed' ? (
        <UnconfirmedEmailBanner />
      ) : error ? (
        <p className={styles.alert} role="alert">
          {getApiErrorMessage(error)}
        </p>
      ) : null}
      <OrderStatusPanel order={order} />
      <div className={styles.columns}>
        <div className={styles.column}>
          <OrderItemsPanel order={order} />
          <OrderAddressPanel order={order} />
        </div>
        <div className={styles.column}>
          <OrderPaymentPanel onOrderChange={setOrder} order={order} />
          <OrderActionsPanel
            onCancel={() => setConfirming(true)}
            onEdit={() => {
              setConflict(false);
              setEditing(true);
            }}
            order={order}
          />
        </div>
      </div>
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
      <Modal
        closeLabel={text.close}
        onOpenChange={setConfirming}
        open={isConfirming}
        title={text.confirmCancel}
      >
        <div className={styles.modalActions}>
          <Button disabled={isPending} onClick={() => void cancel()} variant="outline">
            {text.cancel}
          </Button>
          <Button disabled={isPending} onClick={() => setConfirming(false)} variant="ghost">
            {text.close}
          </Button>
        </div>
      </Modal>
    </section>
  );
}
