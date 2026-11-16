import Link from 'next/link';

import messages from '@/i18n/messages/ar.json';
import { bookRoute } from '@/shared/config/routes';
import { formatDiscountBadge, formatMoney, formatNumber } from '@/shared/lib/format';
import { BookCover } from '@/shared/ui/book-cover';

import type { BookCardItem } from '../types';
import styles from './book-mini-card.module.css';

export type BookMiniCardProps = {
  book: BookCardItem;
  priority?: boolean;
};

// The compact card of the home shelves (".mini" in design/site.css): a tinted tile with the cover, then title, author
// and price. Everything shown comes from the API item; the tile tint is decoration only (it cycles in CSS).
export function BookMiniCard({ book, priority = false }: BookMiniCardProps) {
  const text = messages.catalog;
  const hasDiscount = book.discountPercent > 0 && book.finalPrice < book.price;
  const priceClassName = [styles.price, hasDiscount ? styles.priceSale : '']
    .filter(Boolean)
    .join(' ');

  return (
    <Link className={styles.card} href={bookRoute(book.slug)}>
      <div className={styles.box}>
        {hasDiscount ? (
          <span className={`${styles.tag} ${styles.tagDiscount}`}>
            {formatDiscountBadge(book.discountPercent)}
          </span>
        ) : book.isNew ? (
          <span className={`${styles.tag} ${styles.tagNew}`}>{text.newBadge}</span>
        ) : null}
        <BookCover
          as="div"
          className={styles.cover}
          imageUrl={book.coverImageUrl}
          priority={priority}
          title={book.title}
          variantKey={book.slug}
        />
      </div>
      <div>
        <h3 className={styles.title}>{book.title}</h3>
        {book.authors.length > 0 ? (
          <small className={styles.author}>{book.authors.join(text.authorSeparator)}</small>
        ) : null}
      </div>
      <div className={priceClassName}>
        {formatMoney(book.finalPrice)}
        {hasDiscount ? <s className={styles.oldPrice}>{formatNumber(book.price)}</s> : null}
      </div>
    </Link>
  );
}
