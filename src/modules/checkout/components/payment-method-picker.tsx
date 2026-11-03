'use client';

import { useEffect, useState } from 'react';
import messages from '@/i18n/messages/ar.json';
import { ApiError, getApiErrorMessage } from '@/shared/lib/api';
import { formatNumber } from '@/shared/lib/format';
import { Skeleton } from '@/shared/ui/skeleton';
import { FeatureGate } from '@/shared/ui/soon';
import { getPaymentMethods, type PaymentMethod } from '../api/payment-methods';
import { useCheckout } from '../provider/checkout-provider';

type State =
  | { status: 'loading' }
  | { status: 'ok'; methods: PaymentMethod[] }
  | { status: 'error'; error: unknown };

export function PaymentMethodPicker() {
  const { paymentMethod, setPaymentMethod, setEmailUnconfirmed } = useCheckout();
  const [state, setState] = useState<State>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const text = messages.checkout;
  useEffect(() => {
    let isActive = true;
    void getPaymentMethods()
      .then((methods) => {
        if (!isActive) return;
        setState({ status: 'ok', methods });
        if (methods.length === 0) setPaymentMethod(null);
      })
      .catch((error: unknown) => {
        if (!isActive) return;
        if (
          error instanceof ApiError &&
          error.status === 403 &&
          error.code === 'email_not_confirmed'
        )
          setEmailUnconfirmed(true);
        else setState({ status: 'error', error });
      });
    return () => {
      isActive = false;
    };
  }, [attempt, setPaymentMethod, setEmailUnconfirmed]);

  if (state.status === 'loading')
    return (
      <section>
        <h2>{text.paymentTitle}</h2>
        <div role="status">
          {text.paymentLoading}
          <Skeleton shape="block" />
        </div>
      </section>
    );
  if (state.status === 'error')
    return (
      <section>
        <h2>{text.paymentTitle}</h2>
        <p role="alert">
          {state.error instanceof ApiError ? getApiErrorMessage(state.error) : text.paymentError}
        </p>
        <button
          type="button"
          onClick={() => {
            setState({ status: 'loading' });
            setAttempt((value) => value + 1);
          }}
        >
          {text.retry}
        </button>
      </section>
    );
  if (state.methods.length === 0)
    return (
      <section>
        <h2>{text.paymentTitle}</h2>
        <p role="status">{text.paymentEmpty}</p>
      </section>
    );

  return (
    <fieldset>
      <legend>{text.paymentTitle}</legend>
      {state.methods.map((item) => (
        <div key={item.method}>
          <label>
            <input
              type="radio"
              name="paymentMethod"
              value={item.method}
              checked={paymentMethod === item.method}
              onChange={() => setPaymentMethod(item.method)}
            />
            {item.method === 'CashOnDelivery' ? text.cashOnDelivery : text.manualTransfer}
          </label>
          {item.method === 'CashOnDelivery' ? (
            <p>{text.cashNote}</p>
          ) : item.details ? (
            <>
              <ul>
                {item.details.transferNumbers.map((transfer) => (
                  <li key={`${transfer.channel}-${transfer.number}`}>
                    {transfer.channel === 'VodafoneCash' ? text.vodafoneCash : text.instaPay}:{' '}
                    <bdi dir="ltr">{transfer.number}</bdi>
                  </li>
                ))}
              </ul>
              <p>
                {text.transferExpiry.replace('{hours}', formatNumber(item.details.expiresInHours))}
              </p>
              {item.details.instructions ? <p>{item.details.instructions}</p> : null}
              <FeatureGate feature="payment-proof" label={messages.site.soon} badge="inline">
                <span>{text.proofSoon}</span>
              </FeatureGate>
            </>
          ) : null}
        </div>
      ))}
    </fieldset>
  );
}
