'use client';
import messages from '@/i18n/messages/ar.json';
import { UnconfirmedEmailBanner } from '@/modules/account';
import { ApiError, getApiErrorMessage } from '@/shared/lib/api';
import { Skeleton } from '@/shared/ui/skeleton';
import { CartView } from './cart-view';
import { useCart } from './use-cart';

export function CartPageClient() {
  const { cart, isLoading, error } = useCart();
  if (isLoading)
    return (
      <>
        <h1>{messages.cart.title}</h1>
        <Skeleton shape="card" />
      </>
    );
  if (error || !cart)
    return (
      <>
        <h1>{messages.cart.title}</h1>
        {error instanceof ApiError &&
        error.status === 403 &&
        error.code === 'email_not_confirmed' ? (
          <UnconfirmedEmailBanner />
        ) : (
          <p role="alert">
            {error instanceof ApiError ? getApiErrorMessage(error) : messages.cart.error}
          </p>
        )}
      </>
    );
  return <CartView cart={cart} />;
}
