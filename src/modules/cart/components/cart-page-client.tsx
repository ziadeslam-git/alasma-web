'use client';
import messages from '@/i18n/messages/ar.json';
import { UnconfirmedEmailBanner } from '@/modules/account';
import { ApiError, getApiErrorMessage } from '@/shared/lib/api';
import { Skeleton } from '@/shared/ui/skeleton';
import { CartView } from './cart-view';
import { useCart } from './use-cart';
import styles from './cart-view.module.css';

export function CartPageClient() {
  const { cart, isLoading, error } = useCart();
  if (isLoading)
    return (
      <div className={styles.container} aria-label={messages.cart.loading} role="status">
        <h1>{messages.cart.pageTitle}</h1>
        <Skeleton shape="card" />
      </div>
    );
  if (error || !cart)
    return (
      <div className={styles.container}>
        <h1>{messages.cart.pageTitle}</h1>
        {error instanceof ApiError &&
        error.status === 403 &&
        error.code === 'email_not_confirmed' ? (
          <UnconfirmedEmailBanner />
        ) : (
          <p className={styles.alert} role="alert">
            {error instanceof ApiError ? getApiErrorMessage(error) : messages.cart.error}
          </p>
        )}
      </div>
    );
  return <CartView cart={cart} />;
}
