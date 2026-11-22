import messages from '@/i18n/messages/ar.json';
import { formatMoney, formatNumber } from '@/shared/lib/format';
import { BOOK_COVER_SIZES_THUMB, BookCover } from '@/shared/ui/book-cover';

import type { Order } from '../api/orders-api';
import styles from './order-details.module.css';

// "الكتب": one row per order line with a cover thumbnail, the quantity and the line total the API sends.
export function OrderItemsPanel({ order }: { order: Order }) {
  const text = messages.orders;
  return (
    <section aria-labelledby="order-items-heading" className={styles.panel}>
      <h2 id="order-items-heading">{text.items}</h2>
      <ul className={styles.items}>
        {order.items.map((item, index) => (
          <li className={styles.item} key={`${item.title}-${index}`}>
            <div className={styles.thumb}>
              <BookCover
                as="div"
                sizes={BOOK_COVER_SIZES_THUMB}
                title={item.title}
                variantKey={`${item.bookId ?? item.bundleId ?? 'item'}-${item.title}`}
              />
            </div>
            <div className={styles.itemBody}>
              <b>{item.title}</b>
              <small>{text.quantityLabel.replace('{count}', formatNumber(item.quantity))}</small>
              {item.components.length ? (
                <ul className={styles.components}>
                  {item.components.map((part) => (
                    <li key={part.bookId}>
                      {part.title} · {formatNumber(part.quantity)}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <span className={styles.linePrice}>{formatMoney(item.lineTotal)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
