'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import messages from '@/i18n/messages/ar.json';
import { UnconfirmedEmailBanner } from '@/modules/account';
import { getAuthApi } from '@/modules/auth';
import { useCart } from '@/modules/cart';
import { routes } from '@/shared/config/routes';
import { ApiError, getApiErrorMessage } from '@/shared/lib/api';
import { Skeleton } from '@/shared/ui/skeleton';
import { AddressStep } from './address-step';
import { CouponBox } from './coupon-box';
import { NotesField } from './notes-field';
import { OrderSummary } from './order-summary';
import { PaymentMethodPicker } from './payment-method-picker';
import { PlaceOrderButton } from './place-order';
import { useCheckout } from '../provider/checkout-provider';
import styles from './checkout-page.module.css';

type Confirmation = 'loading' | 'confirmed' | 'unconfirmed' | 'error';

export function CheckoutPage() {
  const router = useRouter();
  const { cart, isLoading, error } = useCart();
  const { isEmailUnconfirmed } = useCheckout();
  const [confirmation, setConfirmation] = useState<Confirmation>('loading');
  const hasCheckedCart = useRef(false);
  useEffect(() => {
    let isActive = true;
    void getAuthApi()
      .me()
      .then((user) => {
        if (isActive) setConfirmation(user.emailConfirmed ? 'confirmed' : 'unconfirmed');
      })
      .catch((cause: unknown) => {
        if (isActive)
          setConfirmation(
            cause instanceof ApiError &&
              cause.status === 403 &&
              cause.code === 'email_not_confirmed'
              ? 'unconfirmed'
              : 'error',
          );
      });
    return () => {
      isActive = false;
    };
  }, []);
  useEffect(() => {
    if (hasCheckedCart.current || isLoading || !cart) return;
    hasCheckedCart.current = true;
    if (cart.items.length === 0) router.replace(routes.cart);
  }, [cart, isLoading, router]);

  return (
    <div className={styles.page}>
      <h1>{messages.checkout.title}</h1>
      {confirmation === 'unconfirmed' || isEmailUnconfirmed ? <UnconfirmedEmailBanner /> : null}
      {confirmation === 'error' ? <p role="alert">{messages.apiErrors.generic}</p> : null}
      {confirmation === 'loading' || isLoading ? <Skeleton shape="card" /> : null}
      {confirmation === 'confirmed' && error ? (
        error instanceof ApiError &&
        error.status === 403 &&
        error.code === 'email_not_confirmed' ? (
          <UnconfirmedEmailBanner />
        ) : (
          <p role="alert">
            {error instanceof ApiError ? getApiErrorMessage(error) : messages.apiErrors.generic}
          </p>
        )
      ) : null}
      {confirmation === 'confirmed' &&
      !isEmailUnconfirmed &&
      !isLoading &&
      !error &&
      Boolean(cart?.items.length) ? (
        <div className={styles.columns}>
          <div className={styles.steps}>
            <AddressStep />
            <PaymentMethodPicker />
            <NotesField />
            <PlaceOrderButton />
          </div>
          <div className={styles.summary}>
            <OrderSummary />
            <CouponBox />
          </div>
        </div>
      ) : null}
    </div>
  );
}
