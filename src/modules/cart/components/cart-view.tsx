'use client';

import { useState } from 'react';
import messages from '@/i18n/messages/ar.json';
import { UnconfirmedEmailBanner } from '@/modules/account';
import { ApiError, getApiErrorMessage } from '@/shared/lib/api';
import { formatMoney, formatNumber } from '@/shared/lib/format';
import { FeatureLink } from '@/shared/ui/soon';
import { routes } from '@/shared/config/routes';
import { Modal } from '@/shared/ui/modal';
import type { Cart, Coupon } from '../api/cart-api';
import { clearCart, removeItem, updateQuantity, validateCoupon } from '../api/cart-api';
import { notifyCartChanged } from '../cart-events';
import styles from './cart.module.css';

export function CartView({ cart, readOnly = false }: { cart: Cart; readOnly?: boolean }) {
  const text = messages.cart;
  const [isPending, setPending] = useState(false);
  const [isConfirming, setConfirming] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [couponResult, setCouponResult] = useState<Coupon | null>(null);
  const [error, setError] = useState('');
  const [isEmailUnconfirmed, setEmailUnconfirmed] = useState(false);
  async function run(action: () => Promise<void>) {
    if (isPending || readOnly) return;
    setPending(true);
    setError('');
    setEmailUnconfirmed(false);
    try {
      await action();
      notifyCartChanged();
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 403 && cause.code === 'email_not_confirmed')
        setEmailUnconfirmed(true);
      setError(cause instanceof ApiError ? getApiErrorMessage(cause) : text.error);
    } finally {
      setPending(false);
    }
  }
  async function applyCoupon() {
    if (isPending || readOnly) return;
    setPending(true);
    setError('');
    setEmailUnconfirmed(false);
    setCouponResult(null);
    try {
      setCouponResult(await validateCoupon(coupon));
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 403 && cause.code === 'email_not_confirmed')
        setEmailUnconfirmed(true);
      setError(cause instanceof ApiError ? getApiErrorMessage(cause) : text.error);
    } finally {
      setPending(false);
    }
  }
  return (
    <div className={styles.container}>
      <h1>{text.title}</h1>
      {isEmailUnconfirmed ? <UnconfirmedEmailBanner /> : error ? <p role="alert">{error}</p> : null}
      {cart.items.length === 0 ? (
        <section>
          <h2>{text.empty}</h2>
          <p>{text.emptyDescription}</p>
        </section>
      ) : (
        <>
          <ul className={styles.items}>
            {cart.items.map((item) => (
              <li className={styles.item} key={item.itemId}>
                <h2>{item.title}</h2>
                <p>{formatMoney(item.lineTotal)}</p>
                {item.warnings.map((warning) => (
                  <p key={warning.code}>
                    {warning.code === 'out_of_stock'
                      ? text.outOfStock
                      : warning.code === 'insufficient_stock'
                        ? text.insufficient
                        : text.unavailable}
                    {warning.availableQuantity === null
                      ? ''
                      : ` ${text.available.replace('{count}', formatNumber(warning.availableQuantity))}`}
                  </p>
                ))}
                <div className={styles.actions}>
                  <button
                    aria-label={`${text.quantity} -`}
                    disabled={readOnly || isPending || item.quantity <= 1}
                    onClick={() => void run(() => updateQuantity(item.itemId, item.quantity - 1))}
                    type="button"
                  >
                    −
                  </button>
                  <span>{formatNumber(item.quantity)}</span>
                  <button
                    aria-label={`${text.quantity} +`}
                    disabled={readOnly || isPending}
                    onClick={() => void run(() => updateQuantity(item.itemId, item.quantity + 1))}
                    type="button"
                  >
                    +
                  </button>
                  <button
                    disabled={readOnly || isPending}
                    onClick={() => void run(() => removeItem(item.itemId))}
                    type="button"
                  >
                    {text.remove}
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <p>
            {text.subtotal}: {formatMoney(cart.subtotal)}
          </p>
          <label>
            {text.coupon}
            <input value={coupon} onChange={(event) => setCoupon(event.target.value)} />
          </label>
          <button
            disabled={readOnly || isPending || !coupon.trim()}
            onClick={() => void applyCoupon()}
            type="button"
          >
            {text.apply}
          </button>
          {couponResult ? (
            <p>
              {text.couponResult}: {formatMoney(couponResult.discountAmount)}
            </p>
          ) : null}
          <button
            disabled={readOnly || isPending}
            onClick={() => setConfirming(true)}
            type="button"
          >
            {text.clear}
          </button>
          <FeatureLink feature="checkout-flow" href={routes.checkout} label={messages.site.soon}>
            {text.checkout}
          </FeatureLink>
          <Modal
            closeLabel={text.close}
            onOpenChange={setConfirming}
            open={isConfirming}
            title={text.confirmClear}
          >
            <button
              onClick={() => {
                setConfirming(false);
                void run(clearCart);
              }}
              type="button"
            >
              {text.confirmClear}
            </button>
            <button onClick={() => setConfirming(false)} type="button">
              {text.cancel}
            </button>
          </Modal>
        </>
      )}
    </div>
  );
}
