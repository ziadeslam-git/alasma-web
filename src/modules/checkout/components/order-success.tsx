'use client';

import { useEffect, useState } from 'react';
import messages from '@/i18n/messages/ar.json';
import { UnconfirmedEmailBanner } from '@/modules/account';
import { getOrder, isOrderId, PaymentProofSection, type Order } from '@/modules/orders';
import { orderRoute, routes } from '@/shared/config/routes';
import { ApiError, getApiErrorMessage } from '@/shared/lib/api';
import { formatDateTime, formatMoney, formatNumber } from '@/shared/lib/format';
import { Button, ButtonLink } from '@/shared/ui/button';
import { Icon } from '@/shared/ui/icon';
import { Skeleton } from '@/shared/ui/skeleton';
import { getPaymentMethods, type PaymentMethod } from '../api/payment-methods';
import styles from './order-success.module.css';

export function OrderSuccess({
  id,
  fixture,
  fixtureMethods,
  fixtureState,
}: {
  id: string;
  fixture?: Order;
  fixtureMethods?: PaymentMethod[];
  fixtureState?: 'loading' | 'not-found';
}) {
  const [order, setOrder] = useState<Order | null>(fixture ?? null);
  const [methods, setMethods] = useState<PaymentMethod[]>(fixtureMethods ?? []);
  const [isLoading, setLoading] = useState(!fixture && isOrderId(id));
  const [isMissing, setMissing] = useState(!fixture && !isOrderId(id));
  const [error, setError] = useState<ApiError | null>(null);
  const [hasMethodsError, setMethodsError] = useState(false);
  const [methodsAttempt, setMethodsAttempt] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const text = messages.checkout;
  const ordersText = messages.orders;

  useEffect(() => {
    if (fixture || fixtureState || !isOrderId(id)) return;
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
  }, [id, fixture, fixtureState, attempt]);

  useEffect(() => {
    if (!order || order.paymentMethod !== 'ManualTransfer' || fixtureMethods) return;
    let isActive = true;
    void getPaymentMethods()
      .then((result) => {
        if (isActive) setMethods(result);
      })
      .catch((cause: unknown) => {
        if (!isActive) return;
        if (
          cause instanceof ApiError &&
          cause.status === 403 &&
          cause.code === 'email_not_confirmed'
        ) {
          setError(cause);
        } else setMethodsError(true);
      });
    return () => {
      isActive = false;
    };
  }, [order, fixtureMethods, methodsAttempt]);

  const title = (
    <>
      <span aria-hidden="true" className={styles.badge}>
        <Icon name="check-c" size="lg" />
      </span>
      <h1 className={styles.title}>{text.orderSuccess}</h1>
    </>
  );
  const homeLink = (
    <div className={styles.actions}>
      <ButtonLink href={routes.home} size="lg" variant="primary">
        {text.continueShopping}
      </ButtonLink>
    </div>
  );
  if (isLoading || fixtureState === 'loading')
    return (
      <section className={styles.page}>
        {title}
        <p className={styles.note} role="status">
          {text.successLoading}
        </p>
        <Skeleton shape="card" />
      </section>
    );
  if (isMissing || fixtureState === 'not-found')
    return (
      <section className={styles.page}>
        {title}
        <p className={styles.note}>{text.successNotFound}</p>
        {homeLink}
      </section>
    );
  if (error?.status === 403 && error.code === 'email_not_confirmed')
    return (
      <section className={styles.page}>
        {title}
        <UnconfirmedEmailBanner />
      </section>
    );
  if (!order)
    return (
      <section className={styles.page}>
        {title}
        {error?.code === 'email_not_confirmed' ? (
          <UnconfirmedEmailBanner />
        ) : (
          <p className={styles.alert} role="alert">
            {error ? getApiErrorMessage(error) : text.successError}
          </p>
        )}
        <div className={styles.actions}>
          <Button
            size="lg"
            variant="primary"
            onClick={() => {
              setLoading(true);
              setError(null);
              setAttempt((value) => value + 1);
            }}
          >
            {text.retry}
          </Button>
        </div>
      </section>
    );

  const details = methods.find((method) => method.method === 'ManualTransfer')?.details;
  return (
    <section className={styles.page}>
      {title}
      <p className={styles.note}>{text.orderSuccessDescription}</p>
      <dl className={styles.receipt}>
        <div>
          <dt>{text.receiptNumber}</dt>
          <dd dir="ltr">{order.orderNumber}</dd>
        </div>
        <div>
          <dt>{text.receiptStatus}</dt>
          <dd>{ordersText.status[order.status]}</dd>
        </div>
        <div>
          <dt>{text.paymentTitle}</dt>
          <dd>
            {order.paymentMethod === 'CashOnDelivery' ? text.cashOnDelivery : text.manualTransfer}
          </dd>
        </div>
        <div>
          <dt>{ordersText.total}</dt>
          <dd>{formatMoney(order.pricing.total)}</dd>
        </div>
        <div>
          <dt>{text.deliverTo}</dt>
          <dd>
            {order.address.city}
            {text.placeSeparator}
            {order.address.governorateName}
          </dd>
        </div>
      </dl>
      <div className={styles.next}>
        {order.paymentMethod === 'ManualTransfer' ? (
          <div className={styles.step}>
            <Icon name="calendar" />
            <div>
              <b>{text.deadlineTitle}</b>
              {order.expiresAt ? (
                <span>{ordersText.expires.replace('{date}', formatDateTime(order.expiresAt))}</span>
              ) : null}
            </div>
          </div>
        ) : null}
        <div className={styles.step}>
          <Icon name="bell" />
          <div>
            <b>{text.updatesTitle}</b>
            <span>{text.updatesText}</span>
          </div>
        </div>
      </div>
      {order.paymentMethod === 'ManualTransfer' ? (
        <section aria-labelledby="success-transfer-title" className={styles.card}>
          <h2 id="success-transfer-title">{text.manualTransfer}</h2>
          {hasMethodsError ? (
            <div className={styles.alert} role="alert">
              <p>{text.paymentError}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setMethodsError(false);
                  setMethodsAttempt((value) => value + 1);
                }}
              >
                {text.retry}
              </Button>
            </div>
          ) : null}
          {details ? (
            <ul className={styles.numbers}>
              {details.transferNumbers.map((transfer) => (
                <li key={`${transfer.channel}-${transfer.number}`}>
                  <span>
                    {transfer.channel === 'VodafoneCash' ? text.vodafoneCash : text.instaPay}
                  </span>
                  <bdi dir="ltr">{transfer.number}</bdi>
                </li>
              ))}
            </ul>
          ) : null}
          <PaymentProofSection order={order} onOrderChange={setOrder} />
        </section>
      ) : null}
      <section aria-labelledby="success-items-title" className={styles.card}>
        <h2 id="success-items-title">{ordersText.items}</h2>
        <ul className={styles.items}>
          {order.items.map((item, index) => (
            <li key={`${item.title}-${index}`}>
              <span>
                {item.title} · {formatNumber(item.quantity)}
              </span>
              <b>{formatMoney(item.lineTotal)}</b>
              {item.components.length ? (
                <ul className={styles.parts}>
                  {item.components.map((part) => (
                    <li key={part.bookId}>
                      {part.title} · {formatNumber(part.quantity)}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
        <dl className={styles.pricing}>
          <div>
            <dt>{ordersText.subtotal}</dt>
            <dd>{formatMoney(order.pricing.subtotal)}</dd>
          </div>
          <div>
            <dt>{ordersText.discount}</dt>
            <dd>{formatMoney(order.pricing.couponDiscount)}</dd>
          </div>
          <div>
            <dt>{ordersText.shipping}</dt>
            <dd>{formatMoney(order.pricing.shippingFee)}</dd>
          </div>
        </dl>
      </section>
      <div className={styles.actions}>
        <ButtonLink href={orderRoute(order.id)} size="lg" variant="primary">
          {text.viewOrder}
        </ButtonLink>
        <ButtonLink href={routes.books} size="lg" variant="outline">
          {text.continueShopping}
        </ButtonLink>
      </div>
    </section>
  );
}
