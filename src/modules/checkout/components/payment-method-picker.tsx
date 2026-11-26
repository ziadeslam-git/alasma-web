'use client';

import { useEffect, useState, type ReactNode } from 'react';
import messages from '@/i18n/messages/ar.json';
import { ApiError, getApiErrorMessage } from '@/shared/lib/api';
import { formatNumber } from '@/shared/lib/format';
import { Skeleton } from '@/shared/ui/skeleton';
import { getPaymentMethods, type PaymentMethod } from '../api/payment-methods';
import { useCheckout } from '../provider/checkout-provider';
import { CheckoutOption } from './checkout-option';
import { CheckoutPanel } from './checkout-panel';
import { CopyButton } from './copy-button';
import styles from './payment-method-picker.module.css';

type State =
  | { status: 'loading' }
  | { status: 'ok'; methods: PaymentMethod[] }
  | { status: 'error'; error: unknown };

function PaymentPanel({ children }: { children: ReactNode }) {
  return (
    <CheckoutPanel step={2} title={messages.checkout.paymentTitle} titleId="checkout-payment-title">
      {children}
    </CheckoutPanel>
  );
}

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
      <PaymentPanel>
        <div role="status">
          <span className={styles.srOnly}>{text.paymentLoading}</span>
          <Skeleton shape="block" />
        </div>
      </PaymentPanel>
    );
  if (state.status === 'error')
    return (
      <PaymentPanel>
        <p className={styles.alert} role="alert">
          {state.error instanceof ApiError ? getApiErrorMessage(state.error) : text.paymentError}
        </p>
        <button
          className={styles.retry}
          type="button"
          onClick={() => {
            setState({ status: 'loading' });
            setAttempt((value) => value + 1);
          }}
        >
          {text.retry}
        </button>
      </PaymentPanel>
    );
  if (state.methods.length === 0)
    return (
      <PaymentPanel>
        <p role="status">{text.paymentEmpty}</p>
      </PaymentPanel>
    );

  return (
    <PaymentPanel>
      <fieldset className={styles.list}>
        <legend className={styles.srOnly}>{text.paymentTitle}</legend>
        {state.methods.map((item) => {
          const isCash = item.method === 'CashOnDelivery';
          const isSelected = paymentMethod === item.method;
          return (
            <div className={styles.entry} key={item.method}>
              <CheckoutOption
                checked={isSelected}
                description={isCash ? text.cashNote : text.transferHint}
                icon={isCash ? 'truck' : 'wallet'}
                name="paymentMethod"
                onChange={() => setPaymentMethod(item.method)}
                title={isCash ? text.cashOnDelivery : text.manualTransfer}
                value={item.method}
              />
              {isSelected && isCash ? (
                <div className={styles.pay}>
                  <p>{text.cashCallNote}</p>
                </div>
              ) : null}
              {isSelected && !isCash && item.details ? (
                <div className={styles.pay}>
                  <ul className={styles.numbers}>
                    {item.details.transferNumbers.map((transfer) => (
                      <li className={styles.number} key={`${transfer.channel}-${transfer.number}`}>
                        <span className={styles.channel}>
                          {transfer.channel === 'VodafoneCash' ? text.vodafoneCash : text.instaPay}
                        </span>
                        <bdi className={styles.value} dir="ltr">
                          {transfer.number}
                        </bdi>
                        <CopyButton value={transfer.number} />
                      </li>
                    ))}
                  </ul>
                  <p>
                    {text.transferExpiry.replace(
                      '{hours}',
                      formatNumber(item.details.expiresInHours),
                    )}
                  </p>
                  {item.details.instructions ? <p>{item.details.instructions}</p> : null}
                  <p>{text.proofAfterOrder}</p>
                </div>
              ) : null}
            </div>
          );
        })}
      </fieldset>
    </PaymentPanel>
  );
}
