'use client';
import Link from 'next/link';
import { useState } from 'react';
import messages from '@/i18n/messages/ar.json';
import { UnconfirmedEmailBanner } from '@/modules/account';
import { routes } from '@/shared/config/routes';
import { ApiError, getApiErrorMessage } from '@/shared/lib/api';
import { formatMoney, formatNumber } from '@/shared/lib/format';
import { Drawer } from '@/shared/ui/drawer';
import { Icon } from '@/shared/ui/icon';
import { BookCover } from '@/shared/ui/book-cover';
import { Skeleton } from '@/shared/ui/skeleton';
import { useCart } from './use-cart';
import styles from './cart.module.css';

export function MiniCart() {
  const [isOpen, setOpen] = useState(false);
  const { cart, isLoading, error } = useCart();
  // The badge counts books (the sum of the line quantities), as the design's label says; the API sends no count field.
  const bookCount = cart ? cart.items.reduce((total, item) => total + item.quantity, 0) : 0;
  return (
    <>
      <button
        aria-label={
          bookCount > 0
            ? messages.site.header.cartWithCount.replace('{count}', formatNumber(bookCount))
            : messages.site.header.cart
        }
        onClick={() => setOpen(true)}
        type="button"
      >
        <Icon name="bag" />
        {cart ? <span>{formatNumber(bookCount)}</span> : null}
      </button>
      <Drawer
        closeLabel={messages.cart.close}
        onOpenChange={setOpen}
        open={isOpen}
        title={messages.cart.title}
      >
        {isLoading ? (
          <div aria-label={messages.cart.loading} role="status">
            <Skeleton shape="card" />
          </div>
        ) : error instanceof ApiError &&
          error.status === 403 &&
          error.code === 'email_not_confirmed' ? (
          <UnconfirmedEmailBanner />
        ) : error ? (
          <p role="alert">
            {error instanceof ApiError ? getApiErrorMessage(error) : messages.cart.error}
          </p>
        ) : cart?.items.length ? (
          <div className={styles.drawerBody}>
            <ul className={styles.items}>
              {cart.items.map((item) => (
                <li className={`${styles.item} ${styles.compactItem}`} key={item.itemId}>
                  <BookCover
                    as="div"
                    className={styles.cover}
                    imageUrl={item.coverImageUrl}
                    title={item.title}
                    variantKey={item.slug}
                  />
                  <div className={styles.itemBody}>
                    <h3 className="h4">{item.title}</h3>
                    <p className={styles.unitPrice}>{formatMoney(item.unitPrice)}</p>
                    <p>
                      {messages.cart.quantity}: {formatNumber(item.quantity)}
                    </p>
                    <p className={styles.lineTotal}>{formatMoney(item.lineTotal)}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className={styles.summaryRow} aria-live="polite">
              <span>{messages.cart.subtotal}</span>
              <span>{formatMoney(cart.subtotal)}</span>
            </p>
          </div>
        ) : (
          <p className={styles.empty}>{messages.cart.empty}</p>
        )}
        <Link className={styles.cta} href={routes.cart} onClick={() => setOpen(false)}>
          {messages.cart.cartLink}
        </Link>
      </Drawer>
    </>
  );
}
