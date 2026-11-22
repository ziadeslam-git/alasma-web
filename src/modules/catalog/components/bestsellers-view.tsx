import Link from 'next/link';

import messages from '@/i18n/messages/ar.json';
import { bookRoute } from '@/shared/config/routes';
import { formatMoney, formatNumber } from '@/shared/lib/format';
import { BookCover } from '@/shared/ui/book-cover';
import { EmptyState } from '@/shared/ui/empty-state';
import { Icon } from '@/shared/ui/icon';
import { FeatureGate } from '@/shared/ui/soon';

import type { BestSellersResult } from '../api/get-best-sellers';
import type { BookCardItem } from '../types';
import { BookCard } from './book-card';
import styles from './bestsellers-view.module.css';

const PODIUM_SIZE = 3;
const COVER_STACK_SIZE = 3;

function PodiumItem({ book, rank }: { book: BookCardItem; rank: number }) {
  const text = messages.bestsellers;
  const href = bookRoute(book.slug);
  return (
    <li className={styles.podiumItem}>
      <span className={styles.place}>{text.podiumPlace.replace('{rank}', formatNumber(rank))}</span>
      <Link aria-hidden="true" className={styles.podiumCover} href={href} tabIndex={-1}>
        <BookCover
          as="div"
          imageUrl={book.coverImageUrl}
          title={book.title}
          variantKey={book.slug}
        />
      </Link>
      <div className={styles.podiumBody}>
        <h2 className={styles.podiumTitle}>
          <Link href={href}>{book.title}</Link>
        </h2>
        {book.authors.length > 0 ? (
          <small className={styles.podiumAuthor}>
            {book.authors.join(messages.catalog.authorSeparator)}
          </small>
        ) : null}
        <Link className={styles.podiumPrice} href={href}>
          {formatMoney(book.finalPrice)}
          <Icon name="arrow" size="sm" />
        </Link>
      </div>
    </li>
  );
}

// "الأكثر مبيعًا" (design/Bestsellers.dc.html): banner, the top 3 on a podium, then the ranked grid. The ranking is the
// API's (copies sold in the last 90 days); no sales numbers are shown because the API sends none.
export function BestsellersView({ result }: { result: BestSellersResult }) {
  const text = messages.bestsellers;
  const items = result.items;
  const podium = items.slice(0, PODIUM_SIZE);
  const rest = items.slice(PODIUM_SIZE);

  return (
    <div className={styles.page}>
      <section className={styles.banner}>
        <div>
          <span className={styles.eyebrow}>{text.eyebrow}</span>
          <h1>{text.heading}</h1>
          <p>{text.intro}</p>
        </div>
        {items.length > 0 ? (
          <div aria-hidden="true" className={styles.stack}>
            {items.slice(0, COVER_STACK_SIZE).map((book) => (
              <BookCover
                as="div"
                className={styles.stackCover}
                imageUrl={book.coverImageUrl}
                key={book.id}
                title={book.title}
                variantKey={book.slug}
              />
            ))}
          </div>
        ) : null}
      </section>

      <FeatureGate badge="inline" feature="bestsellers-period" label={messages.site.soon}>
        <nav aria-label={text.periodLabel} className={styles.tabs}>
          <span aria-current="true">{text.tabWeek}</span>
          <span>{text.tabMonth}</span>
          <span>{text.tabAll}</span>
        </nav>
      </FeatureGate>

      {result.status === 'error' ? (
        <div className={styles.message} role="alert">
          <p>{text.error}</p>
        </div>
      ) : result.status === 'empty' ? (
        <EmptyState description={text.emptyDescription} icon="book" title={text.emptyTitle} />
      ) : (
        <>
          <ol aria-label={text.listLabel} className={styles.podium}>
            {podium.map((book, index) => (
              <PodiumItem book={book} key={book.id} rank={index + 1} />
            ))}
          </ol>
          {rest.length > 0 ? (
            <ul className={styles.grid}>
              {rest.map((book, index) => (
                <li key={book.id}>
                  <BookCard book={book} rank={index + PODIUM_SIZE + 1} />
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )}
    </div>
  );
}
