'use client';

import type { ReactNode } from 'react';
import messages from '@/i18n/messages/ar.json';
import type { components } from '@/shared/lib/api';
import { BOOK_COVER_SIZES_THUMB, BookCover } from '@/shared/ui/book-cover';
import { formatMoney, formatNumber } from '@/shared/lib/format';
import { Skeleton } from '@/shared/ui/skeleton';
import { useCheckout } from '../provider/checkout-provider';
import styles from './order-summary.module.css';

type CartLine = components['schemas']['CartDto']['items'][number];

type OrderSummaryProps = {
  // Cart lines only supply the cover image and slug; every amount comes from the checkout preview.
  cartItems?: CartLine[];
  // Rendered between the items and the totals (the coupon box).
  couponSlot?: ReactNode;
};

export function OrderSummary({ cartItems, couponSlot }: OrderSummaryProps) {
  const { preview } = useCheckout();
  const text = messages.checkout;
  return (
    <section aria-labelledby="checkout-summary-title" className={styles.summary}>
      <h2 className={styles.title} id="checkout-summary-title">
        {text.summaryTitle}
      </h2>
      {preview.status === 'idle' ? <p className={styles.note}>{text.previewIdle}</p> : null}
      {preview.status === 'loading' ? (
        <div role="status">
          <span className={styles.note}>{text.previewLoading}</span>
          <Skeleton shape="block" />
        </div>
      ) : null}
      {preview.status === 'error' ? (
        <p className={styles.alert} role="alert">
          {preview.message}
        </p>
      ) : null}
      {preview.status === 'ok' ? (
        <ul className={styles.items}>
          {preview.data.items.map((item, index) => {
            const productId = item.bookId ?? item.bundleId;
            const line = cartItems?.find(
              (cartLine) => cartLine.kind === item.kind && cartLine.productId === productId,
            );
            return (
              <li className={styles.item} key={`${item.kind}-${productId}-${index}`}>
                {line ? (
                  <div className={styles.thumb}>
                    <BookCover
                      as="div"
                      className={styles.cover}
                      imageUrl={line.coverImageUrl}
                      sizes={BOOK_COVER_SIZES_THUMB}
                      title={item.title}
                      variantKey={line.slug}
                    />
                  </div>
                ) : null}
                <div className={styles.itemBody}>
                  <b>{item.title}</b>
                  <small>
                    {text.quantityLabel.replace('{count}', formatNumber(item.quantity))}
                  </small>
                  {item.warning ? (
                    <small className={styles.warning} role="status">
                      {messages.cart.unavailable}
                      {item.availableQuantity === null
                        ? ''
                        : ` ${messages.cart.available.replace('{count}', formatNumber(item.availableQuantity))}`}
                    </small>
                  ) : null}
                </div>
                <span className={styles.price}>{formatMoney(item.lineTotal)}</span>
              </li>
            );
          })}
        </ul>
      ) : null}
      {couponSlot}
      {preview.status === 'ok' ? (
        <>
          <dl className={styles.totals}>
            <div>
              <dt>{messages.cart.subtotal}</dt>
              <dd>{formatMoney(preview.data.subtotal)}</dd>
            </div>
            {preview.data.couponDiscount > 0 ? (
              <div className={styles.discount}>
                <dt>
                  {preview.data.couponCode
                    ? text.couponDiscountNamed.replace('{code}', preview.data.couponCode)
                    : text.couponDiscount}
                </dt>
                <dd>− {formatMoney(preview.data.couponDiscount)}</dd>
              </div>
            ) : null}
            <div>
              <dt>{text.shippingTo.replace('{zone}', preview.data.zone.governorate)}</dt>
              <dd>{formatMoney(preview.data.shippingFee)}</dd>
            </div>
            <div className={styles.total}>
              <dt>{text.total}</dt>
              <dd>{formatMoney(preview.data.total)}</dd>
            </div>
          </dl>
          {preview.data.freeShippingApplied ? (
            <p className={styles.note}>{text.freeShipping}</p>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
