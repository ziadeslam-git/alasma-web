'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import messages from '@/i18n/messages/ar.json';
import { UnconfirmedEmailBanner } from '@/modules/account';
import { getOrder, isOrderId, type Order } from '@/modules/orders';
import { orderRoute, routes } from '@/shared/config/routes';
import { ApiError, getApiErrorMessage } from '@/shared/lib/api';
import { formatDateTime, formatMoney, formatNumber } from '@/shared/lib/format';
import { Skeleton } from '@/shared/ui/skeleton';
import { FeatureGate } from '@/shared/ui/soon';
import { getPaymentMethods, type PaymentMethod } from '../api/payment-methods';

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

  if (isLoading || fixtureState === 'loading')
    return (
      <section>
        <h1>{text.orderSuccess}</h1>
        <p role="status">{text.successLoading}</p>
        <Skeleton shape="card" />
      </section>
    );
  if (isMissing || fixtureState === 'not-found')
    return (
      <section>
        <h1>{text.orderSuccess}</h1>
        <p>{text.successNotFound}</p>
        <Link href={routes.home}>{text.continueShopping}</Link>
      </section>
    );
  if (error?.status === 403 && error.code === 'email_not_confirmed')
    return (
      <section>
        <h1>{text.orderSuccess}</h1>
        <UnconfirmedEmailBanner />
      </section>
    );
  if (!order)
    return (
      <section>
        <h1>{text.orderSuccess}</h1>
        {error?.code === 'email_not_confirmed' ? (
          <UnconfirmedEmailBanner />
        ) : (
          <p role="alert">{error ? getApiErrorMessage(error) : text.successError}</p>
        )}
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            setError(null);
            setAttempt((value) => value + 1);
          }}
        >
          {text.retry}
        </button>
      </section>
    );

  const details = methods.find((method) => method.method === 'ManualTransfer')?.details;
  return (
    <section>
      <h1>{text.orderSuccess}</h1>
      <p>{text.orderSuccessDescription}</p>
      <p>{order.orderNumber}</p>
      <p>{ordersText.status[order.status]}</p>
      <h2>{ordersText.items}</h2>
      <ul>
        {order.items.map((item, index) => (
          <li key={`${item.title}-${index}`}>
            <p>
              {item.title} · {formatNumber(item.quantity)} · {formatMoney(item.lineTotal)}
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
          </li>
        ))}
      </ul>
      <h2>{ordersText.pricing}</h2>
      <p>
        {ordersText.subtotal}: {formatMoney(order.pricing.subtotal)}
      </p>
      <p>
        {ordersText.discount}: {formatMoney(order.pricing.couponDiscount)}
      </p>
      <p>
        {ordersText.shipping}: {formatMoney(order.pricing.shippingFee)}
      </p>
      <p>
        {ordersText.total}: {formatMoney(order.pricing.total)}
      </p>
      <h2>{text.paymentTitle}</h2>
      {order.paymentMethod === 'CashOnDelivery' ? (
        <p>
          {text.cashOnDelivery} · {text.cashNote}
        </p>
      ) : (
        <>
          <p>{text.manualTransfer}</p>
          {hasMethodsError ? (
            <div role="alert">
              <p>{text.paymentError}</p>
              <button
                type="button"
                onClick={() => {
                  setMethodsError(false);
                  setMethodsAttempt((value) => value + 1);
                }}
              >
                {text.retry}
              </button>
            </div>
          ) : null}
          {details ? (
            <ul>
              {details.transferNumbers.map((transfer) => (
                <li key={`${transfer.channel}-${transfer.number}`}>
                  {transfer.channel === 'VodafoneCash' ? text.vodafoneCash : text.instaPay}:{' '}
                  <bdi dir="ltr">{transfer.number}</bdi>
                </li>
              ))}
            </ul>
          ) : null}
          {order.expiresAt ? (
            <p>{ordersText.expires.replace('{date}', formatDateTime(order.expiresAt))}</p>
          ) : null}
          <FeatureGate feature="payment-proof" label={messages.site.soon} badge="inline">
            <span>{text.proofSoon}</span>
          </FeatureGate>
        </>
      )}
      <p>
        <Link href={orderRoute(order.id)}>{text.viewOrder}</Link>
      </p>
      <p>
        <Link href={routes.home}>{text.continueShopping}</Link>
      </p>
    </section>
  );
}
