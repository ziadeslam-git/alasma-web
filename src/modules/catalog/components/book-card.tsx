import Link from 'next/link';

import messages from '@/i18n/messages/ar.json';
import { bookRoute } from '@/shared/config/routes';
import { formatDiscountBadge, formatMoney, formatNumber } from '@/shared/lib/format';
import { BookCover } from '@/shared/ui/book-cover';
import { Icon } from '@/shared/ui/icon';
import { FeatureGate } from '@/shared/ui/soon';

import type { BookCardItem } from '../types';
import styles from './book-card.module.css';

export type BookCardProps = {
  book: BookCardItem;
};

export function BookCard({ book }: BookCardProps) {
  const text = messages.catalog;
  const soonLabel = messages.site.soon;
  const href = bookRoute(book.slug);
  const isOutOfStock = book.stockStatus === 'OutOfStock';
  const isLowStock = book.stockStatus === 'LowStock';
  const hasDiscount = book.discountPercent > 0 && book.finalPrice < book.price;
  const authorsText =
    book.authors.length > 0
      ? `${text.authorPrefix}${book.authors.join(text.authorSeparator)}`
      : null;

  const cardClassName = [styles.card, isOutOfStock ? styles.outOfStock : '']
    .filter(Boolean)
    .join(' ');
  const priceClassName = [styles.price, hasDiscount ? styles.priceSale : '']
    .filter(Boolean)
    .join(' ');

  return (
    <article className={cardClassName}>
      <div className={styles.figure}>
        {hasDiscount ? (
          <span className={`${styles.tag} ${styles.tagDiscount}`}>
            {formatDiscountBadge(book.discountPercent)}
          </span>
        ) : null}
        <div className={styles.badges}>
          {isOutOfStock ? (
            <span className={`${styles.tag} ${styles.tagLow}`}>{text.stock.outOfStock}</span>
          ) : isLowStock ? (
            <span className={`${styles.tag} ${styles.tagLow}`}>{text.stock.lowStock}</span>
          ) : null}
          {book.isFeatured ? (
            <span className={`${styles.tag} ${styles.tagFeatured}`}>{text.featuredBadge}</span>
          ) : null}
          {book.isNew && !hasDiscount ? (
            <span className={`${styles.tag} ${styles.tagNew}`}>{text.newBadge}</span>
          ) : null}
        </div>
        <Link aria-hidden="true" className={styles.top} href={href} tabIndex={-1}>
          <BookCover
            as="div"
            className={styles.cover}
            imageUrl={book.coverImageUrl}
            title={book.title}
            variantKey={book.slug}
          />
        </Link>

        <div className={styles.actions}>
          <FeatureGate feature="quick-view" label={soonLabel}>
            <span />
          </FeatureGate>
          {isOutOfStock ? (
            <FeatureGate feature="reservations-notify-me" label={soonLabel}>
              <button
                className={`${styles.actionButton} ${styles.notifyButton}`}
                disabled
                type="button"
              >
                <Icon name="bell" size="sm" />
                <span>{text.notifyMe}</span>
              </button>
            </FeatureGate>
          ) : (
            <FeatureGate feature="cart-page" label={soonLabel}>
              <button
                aria-label={text.addToCart.replace('{title}', book.title)}
                className={styles.actionButton}
                disabled
                type="button"
              >
                <Icon name="bag" />
              </button>
            </FeatureGate>
          )}
          <FeatureGate feature="wishlist-heart" label={soonLabel}>
            <button
              aria-label={text.addToWishlist.replace('{title}', book.title)}
              className={styles.actionButton}
              disabled
              type="button"
            >
              <Icon name="heart" size="sm" />
            </button>
          </FeatureGate>
        </div>
      </div>

      <div className={styles.body}>
        {authorsText ? <span className={styles.authors}>{authorsText}</span> : null}
        <h3 className={styles.titleHeading}>
          <Link className={styles.titleLink} href={href}>
            {book.title}
          </Link>
        </h3>
        <div className={styles.foot}>
          <span className={priceClassName}>
            {formatMoney(book.finalPrice)}
            {hasDiscount ? <s className={styles.oldPrice}>{formatNumber(book.price)}</s> : null}
          </span>
        </div>
      </div>
    </article>
  );
}
