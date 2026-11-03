'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import messages from '@/i18n/messages/ar.json';
import { UnconfirmedEmailBanner } from '@/modules/account';
import { notifyCartChanged, useCart } from '@/modules/cart';
import { checkoutSuccessRoute, routes } from '@/shared/config/routes';
import { ApiError, getApiErrorMessage } from '@/shared/lib/api';
import { formatNumber } from '@/shared/lib/format';
import { createOrder } from '../api/create-order';
import { useCheckout } from '../provider/checkout-provider';

export function PlaceOrderButton() {
  const router = useRouter();
  const { cart, error: cartError } = useCart();
  const {
    addressId,
    appliedCouponCode,
    paymentMethod,
    notes,
    preview,
    getPurchaseKey,
    clearPurchaseAttempt,
    setEmailUnconfirmed,
  } = useCheckout();
  const [isPending, setPending] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [hasMismatch, setMismatch] = useState(false);
  const [isUnconfirmed, setUnconfirmed] = useState(false);
  const isSubmitting = useRef(false);

  useEffect(() => {
    if (
      cartError instanceof ApiError &&
      cartError.status === 403 &&
      cartError.code === 'email_not_confirmed'
    ) {
      setUnconfirmed(true);
      setEmailUnconfirmed(true);
    }
  }, [cartError, setEmailUnconfirmed]);

  async function submit() {
    if (
      isSubmitting.current ||
      !cart ||
      addressId === null ||
      !paymentMethod ||
      preview.status !== 'ok'
    )
      return;
    isSubmitting.current = true;
    setPending(true);
    setError(null);
    setMismatch(false);
    setUnconfirmed(false);
    try {
      const key = await getPurchaseKey(cart.items);
      const body = {
        addressId,
        couponCode: appliedCouponCode,
        paymentMethod,
        notes: notes || null,
      };
      let order;
      try {
        order = await createOrder(body, key);
      } catch (cause) {
        if (!(cause instanceof ApiError) || cause.code !== 'idempotency_in_progress') throw cause;
        await new Promise<void>((resolve) =>
          setTimeout(resolve, (cause.retryAfterSeconds ?? 1) * 1000),
        );
        order = await createOrder(body, key);
      }
      clearPurchaseAttempt();
      notifyCartChanged();
      router.push(checkoutSuccessRoute(order.id));
    } catch (cause) {
      const failure = cause instanceof ApiError ? cause : new ApiError({ kind: 'unknown' });
      if (failure.status === 403 && failure.code === 'email_not_confirmed') {
        setUnconfirmed(true);
        setEmailUnconfirmed(true);
      } else if (failure.code === 'idempotency_key_mismatch') {
        clearPurchaseAttempt();
        setMismatch(true);
      } else setError(failure);
    } finally {
      isSubmitting.current = false;
      setPending(false);
    }
  }

  return (
    <div>
      {isUnconfirmed ? <UnconfirmedEmailBanner /> : null}
      {hasMismatch ? <p role="alert">{messages.checkout.confirmAgain}</p> : null}
      {error ? (
        <div role="alert">
          <p>{getApiErrorMessage(error)}</p>
          {error.books?.length ? (
            <ul>
              {error.books.map((book) => (
                <li key={book.bookId}>
                  {book.title} ·{' '}
                  {messages.cart.available.replace('{count}', formatNumber(book.availableQuantity))}
                </li>
              ))}
            </ul>
          ) : null}
          {error.items?.length ? (
            <ul>
              {error.items.map((item) => (
                <li key={item.itemId}>{item.title}</li>
              ))}
            </ul>
          ) : null}
          {error.code === 'stock_insufficient' || error.code === 'cart_has_unavailable_items' ? (
            <Link href={routes.cart}>{messages.checkout.returnToCart}</Link>
          ) : null}
        </div>
      ) : null}
      <button
        disabled={
          isPending || !cart || addressId === null || !paymentMethod || preview.status !== 'ok'
        }
        onClick={() => void submit()}
        type="button"
      >
        {isPending ? messages.checkout.placingOrder : messages.checkout.placeOrder}
      </button>
    </div>
  );
}
