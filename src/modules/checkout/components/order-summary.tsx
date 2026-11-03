'use client';

import messages from '@/i18n/messages/ar.json';
import { formatMoney, formatNumber } from '@/shared/lib/format';
import { Skeleton } from '@/shared/ui/skeleton';
import { useCheckout } from '../provider/checkout-provider';
import styles from './order-summary.module.css';

export function OrderSummary() {
  const { preview } = useCheckout();
  const text = messages.checkout;
  return (
    <section className={styles.summary} aria-labelledby="checkout-summary-title">
      <h2 id="checkout-summary-title">{text.summaryTitle}</h2>
      {preview.status === 'idle' ? <p>{text.previewIdle}</p> : null}
      {preview.status === 'loading' ? (
        <div role="status">
          <span>{text.previewLoading}</span>
          <Skeleton shape="block" />
        </div>
      ) : null}
      {preview.status === 'error' ? <p role="alert">{preview.message}</p> : null}
      {preview.status === 'ok' ? (
        <>
          <ul className={styles.items}>
            {preview.data.items.map((item, index) => (
              <li key={`${item.kind}-${item.bookId ?? item.bundleId}-${index}`}>
                <p>
                  {item.title} × {formatNumber(item.quantity)}
                </p>
                <p>{formatMoney(item.lineTotal)}</p>
                {item.warning ? (
                  <p role="status">
                    {messages.cart.unavailable}
                    {item.availableQuantity === null
                      ? ''
                      : ` ${messages.cart.available.replace('{count}', formatNumber(item.availableQuantity))}`}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
          <dl className={styles.totals}>
            <div>
              <dt>{messages.cart.subtotal}</dt>
              <dd>{formatMoney(preview.data.subtotal)}</dd>
            </div>
            <div>
              <dt>{text.couponDiscount}</dt>
              <dd>{formatMoney(preview.data.couponDiscount)}</dd>
            </div>
            <div>
              <dt>{text.shippingFee}</dt>
              <dd>{formatMoney(preview.data.shippingFee)}</dd>
            </div>
            <div>
              <dt>{text.zone}</dt>
              <dd>{preview.data.zone.governorate}</dd>
            </div>
            <div>
              <dt>{text.total}</dt>
              <dd>{formatMoney(preview.data.total)}</dd>
            </div>
          </dl>
          {preview.data.freeShippingApplied ? <p>{text.freeShipping}</p> : null}
        </>
      ) : null}
    </section>
  );
}
