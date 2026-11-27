'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import messages from '@/i18n/messages/ar.json';
import { UnconfirmedEmailBanner } from '@/modules/account';
import { ApiError, getApiErrorMessage } from '@/shared/lib/api';
import { formatMoney, formatNumber } from '@/shared/lib/format';
import { routes } from '@/shared/config/routes';
import { ButtonLink } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { Modal } from '@/shared/ui/modal';
import { BOOK_COVER_SIZES_THUMB, BookCover } from '@/shared/ui/book-cover';
import { Icon } from '@/shared/ui/icon';
import { Input } from '@/shared/ui/input';
import { FeatureGate } from '@/shared/ui/soon';
import type { Cart, Coupon } from '../api/cart-api';
import { clearCart, removeItem, updateQuantity, validateCoupon } from '../api/cart-api';
import { notifyCartChanged } from '../cart-events';
import styles from './cart-view.module.css';

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
    setEmailUnconfirmed(false);
    setCouponResult(null);
    try {
      setCouponResult(await validateCoupon(coupon));
    } catch (cause) {
      // An unconfirmed email shows the same banner (with its resend action) as every other cart action; any other coupon
      // error stays in the box beside the field.
      if (cause instanceof ApiError && cause.status === 403 && cause.code === 'email_not_confirmed')
        setEmailUnconfirmed(true);
      else setCouponError(cause instanceof ApiError ? getApiErrorMessage(cause) : text.error);
    } finally {
      setPending(false);
    }
  }
  const itemCount = cart.items.length;
  const countLabel =
    itemCount === 1
      ? text.countOne
      : itemCount === 2
        ? text.countTwo
        : text.countMany.replace('{count}', formatNumber(itemCount));
  const totalAmount = couponResult ? couponResult.subtotalAfterDiscount : cart.subtotal;
  return (
    <div className={styles.container}>
      <nav aria-label={text.breadcrumbLabel} className={styles.crumb}>
        <Link href={routes.books}>
          <Icon name="arrow-r" size="sm" />
          {messages.checkout.continueShopping}
        </Link>
        <span aria-hidden="true">/</span>
        <b>{text.breadcrumbCurrent}</b>
      </nav>
      <div className={styles.titleRow}>
        <h1>{text.pageTitle}</h1>
        {itemCount > 0 ? <span className={styles.titleCount}>{countLabel}</span> : null}
      </div>
      {isEmailUnconfirmed ? (
        <UnconfirmedEmailBanner />
      ) : error ? (
        <p className={styles.alert} role="alert">
          {error}
        </p>
      ) : null}
      {cart.items.length === 0 ? (
        <EmptyState
          action={
            <ButtonLink href={routes.books} variant="primary">
              {text.browseStore}
            </ButtonLink>
          }
          description={text.emptyDescription}
          icon="bag"
          title={text.empty}
          variant="search"
        />
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
                    sizes={BOOK_COVER_SIZES_THUMB}
                    title={item.title}
                    variantKey={item.slug}
                  />
                  <div className={styles.itemBody}>
                    <div className={styles.itemTop}>
                      <div className={styles.itemTitle}>
                        <h2>{item.title}</h2>
                        {item.warnings.map((warning) => (
                          <span className={styles.tag} key={warning.code}>
                            {warning.code === 'out_of_stock'
                              ? text.outOfStock
                              : warning.code === 'insufficient_stock'
                                ? text.limited
                                : text.unavailable}
                          </span>
                        ))}
                      </div>
                      <p className={styles.lineTotal} aria-live="polite">
                        {formatMoney(item.lineTotal)}
                      </p>
                    </div>
                    <p className={styles.unitPrice}>
                      {item.discountPercent > 0 ? <s>{formatMoney(item.listUnitPrice)}</s> : null}
                      <span>{formatMoney(item.unitPrice)}</span>
                      {item.warnings.map((warning) =>
                        warning.code === 'insufficient_stock' &&
                        warning.availableQuantity !== null ? (
                          <span key={warning.code}>
                            {text.available.replace(
                              '{count}',
                              formatNumber(warning.availableQuantity),
                            )}
                          </span>
                        ) : null,
                      )}
                    </p>
                    <div className={styles.itemFoot}>
                      <div className={styles.links}>
                        <button
                          className={styles.linkButton}
                          disabled={readOnly || isPending}
                          onClick={() => void run(() => removeItem(item.itemId))}
                          type="button"
                        >
                          <Icon name="trash" size="sm" />
                          {text.remove}
                        </button>
                        <FeatureGate feature="save-for-later" label={messages.site.soon}>
                          <button className={styles.linkButton} type="button">
                            <Icon name="bookmark" size="sm" />
                            {text.saveForLater}
                          </button>
                        </FeatureGate>
                      </div>
                      <div className={styles.stepper}>
                        <button
                          aria-label={messages.cart.increaseQuantity}
                          disabled={readOnly || isPending}
                          onClick={() =>
                            void run(() => updateQuantity(item.itemId, item.quantity + 1))
                          }
                          type="button"
                        >
                          <Icon name="plus" size="sm" />
                        </button>
                        <span>{formatNumber(item.quantity)}</span>
                        <button
                          aria-label={messages.cart.decreaseQuantity}
                          disabled={readOnly || isPending || item.quantity <= 1}
                          onClick={() =>
                            void run(() => updateQuantity(item.itemId, item.quantity - 1))
                          }
                          type="button"
                        >
                          <Icon name="minus" size="sm" />
                        </button>
                      </div>
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
            <h2>{messages.checkout.summaryTitle}</h2>
            <div className={styles.summaryRow} aria-live="polite">
              <span>{text.subtotal}</span>
              <b>{formatMoney(cart.subtotal)}</b>
            </div>
            {couponResult ? (
              <div className={styles.summaryRow}>
                <span>{text.couponDiscount}</span>
                <b className={styles.discountValue}>- {formatMoney(couponResult.discountAmount)}</b>
              </div>
            ) : null}
            <div className={styles.coupon}>
              <label className={styles.couponLabel}>
                {text.coupon}
                <Input
                  aria-describedby={couponError ? couponErrorId : undefined}
                  aria-invalid={couponError ? true : undefined}
                  value={coupon}
                  onChange={(event) => {
                    setCoupon(event.target.value);
                    setCouponError('');
                  }}
                />
              </label>
              <button
                className={styles.couponButton}
                disabled={readOnly || isPending || !coupon.trim()}
                onClick={() => void applyCoupon()}
                type="button"
              >
                {text.apply}
              </button>
              {couponError ? (
                <p className={styles.couponError} id={couponErrorId} role="alert">
                  {couponError}
                </p>
              ) : null}
              {couponResult ? (
                <p className={styles.success} role="status">
                  {text.couponResult}: {formatMoney(couponResult.discountAmount)}
                </p>
              ) : null}
            </div>
            <div className={styles.total}>
              <span>{text.total}</span>
              <b>{formatMoney(totalAmount)}</b>
            </div>
            <p className={styles.shippingNote}>{text.shippingAtCheckout}</p>
            <ButtonLink
              className={styles.checkout}
              fullWidth
              href={routes.checkout}
              size="lg"
              trailingIcon="arrow"
              variant="primary"
            >
              {text.checkout}
            </ButtonLink>
            <div className={styles.trust}>
              <span>
                <Icon name="lock" size="sm" />
                {text.securePayment}
              </span>
              <span>
                <Icon name="shield" size="sm" />
                {text.genuineCopies}
              </span>
            </div>
            <p className={styles.payments}>{messages.site.footer.paymentMethodsLine}</p>
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
