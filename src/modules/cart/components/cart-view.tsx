'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import messages from '@/i18n/messages/ar.json';
import { UnconfirmedEmailBanner } from '@/modules/account';
import { ApiError, getApiErrorMessage } from '@/shared/lib/api';
import { formatMoney, formatNumber } from '@/shared/lib/format';
import { routes } from '@/shared/config/routes';
import { Modal } from '@/shared/ui/modal';
import { BookCover } from '@/shared/ui/book-cover';
import { Icon } from '@/shared/ui/icon';
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
  const [couponError, setCouponError] = useState('');
  const couponErrorId = useId();
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
    setCouponError('');
    setCouponResult(null);
    try {
      setCouponResult(await validateCoupon(coupon));
    } catch (cause) {
      setCouponError(cause instanceof ApiError ? getApiErrorMessage(cause) : text.error);
    } finally {
      setPending(false);
    }
  }
  return (
    <div className={styles.container}>
      <h1>{text.title}</h1>
      {isEmailUnconfirmed ? <UnconfirmedEmailBanner /> : error ? <p role="alert">{error}</p> : null}
      {cart.items.length === 0 ? (
        <section className={styles.empty}>
          <h2>{text.empty}</h2>
          <p>{text.emptyDescription}</p>
          <Link className={styles.cta} href={routes.books}>
            {text.browseStore}
          </Link>
        </section>
      ) : (
        <div className={styles.layout}>
          <div>
            <ul className={styles.items}>
              {cart.items.map((item) => (
                <li className={styles.item} key={item.itemId}>
                  <BookCover
                    as="div"
                    className={styles.cover}
                    imageUrl={item.coverImageUrl}
                    title={item.title}
                    variantKey={item.slug}
                  />
                  <div className={styles.itemBody}>
                    <h2 className="h4">{item.title}</h2>
                    <p className={styles.unitPrice}>{formatMoney(item.unitPrice)}</p>
                    <p className={styles.lineTotal} aria-live="polite">
                      {formatMoney(item.lineTotal)}
                    </p>
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
                        aria-label={messages.cart.decreaseQuantity}
                        disabled={readOnly || isPending || item.quantity <= 1}
                        onClick={() =>
                          void run(() => updateQuantity(item.itemId, item.quantity - 1))
                        }
                        type="button"
                      >
                        <Icon name="minus" />
                      </button>
                      <span>{formatNumber(item.quantity)}</span>
                      <button
                        aria-label={messages.cart.increaseQuantity}
                        disabled={readOnly || isPending}
                        onClick={() =>
                          void run(() => updateQuantity(item.itemId, item.quantity + 1))
                        }
                        type="button"
                      >
                        <Icon name="plus" />
                      </button>
                      <button
                        disabled={readOnly || isPending}
                        onClick={() => void run(() => removeItem(item.itemId))}
                        type="button"
                      >
                        {text.remove}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <button
              className={styles.clear}
              disabled={readOnly || isPending}
              onClick={() => setConfirming(true)}
              type="button"
            >
              {text.clear}
            </button>
          </div>
          <aside className={styles.summary}>
            <h2 className="h4">{messages.checkout.summaryTitle}</h2>
            <div className={styles.summaryRow} aria-live="polite">
              <span>{text.subtotal}</span>
              <span>{formatMoney(cart.subtotal)}</span>
            </div>
            <div className={styles.coupon}>
              <label className={styles.couponLabel}>
                {text.coupon}
                <input
                  aria-describedby={couponError ? couponErrorId : undefined}
                  aria-invalid={couponError ? true : undefined}
                  className={styles.input}
                  value={coupon}
                  onChange={(event) => {
                    setCoupon(event.target.value);
                    setCouponError('');
                  }}
                />
              </label>
              {couponError ? (
                <p className={styles.couponError} id={couponErrorId} role="alert">
                  {couponError}
                </p>
              ) : null}
              <button
                className={styles.secondary}
                disabled={readOnly || isPending || !coupon.trim()}
                onClick={() => void applyCoupon()}
                type="button"
              >
                {text.apply}
              </button>
              {couponResult ? (
                <p className={styles.success} role="status">
                  {text.couponResult}: {formatMoney(couponResult.discountAmount)}
                </p>
              ) : null}
            </div>
            <Link className={styles.cta} href={routes.checkout}>
              {text.checkout}
            </Link>
          </aside>
          <Modal
            closeLabel={text.close}
            onOpenChange={setConfirming}
            open={isConfirming}
            title={text.confirmClear}
          >
            <button
              className={styles.modalPrimary}
              onClick={() => {
                setConfirming(false);
                void run(clearCart);
              }}
              type="button"
            >
              {text.confirmClear}
            </button>
            <button className={styles.secondary} onClick={() => setConfirming(false)} type="button">
              {text.cancel}
            </button>
          </Modal>
        </div>
      )}
    </div>
  );
}
