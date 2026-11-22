import Link from 'next/link';

import messages from '@/i18n/messages/ar.json';
import { BookGrid } from '@/modules/catalog';
import { routes } from '@/shared/config/routes';
import { formatMoney } from '@/shared/lib/format';
import { BookCover } from '@/shared/ui/book-cover';
import { EmptyState } from '@/shared/ui/empty-state';
import { Icon } from '@/shared/ui/icon';
import { FeatureGate } from '@/shared/ui/soon';

import type { Bundle, BundlesResult, DiscountedBooksResult } from '../api/offers-api';
import styles from './offers.module.css';

const COVERS_PER_BUNDLE = 3;

function BundleCard({ bundle }: { bundle: Bundle }) {
  const text = messages.offers;
  const isUnavailable = bundle.stockStatus === 'OutOfStock';
  const hasSaving = bundle.saving > 0;
  return (
    <article className={styles.bundle}>
      {hasSaving ? (
        <span className={styles.saving}>
          {text.save.replace('{amount}', formatMoney(bundle.saving))}
        </span>
      ) : null}
      <div aria-hidden="true" className={styles.covers}>
        {bundle.books.slice(0, COVERS_PER_BUNDLE).map((entry) => (
          <BookCover
            as="div"
            className={styles.cover}
            imageUrl={entry.book.coverImageUrl}
            key={entry.book.id}
            title={entry.book.title}
            variantKey={entry.book.slug}
          />
        ))}
      </div>
      <div>
        <h3 className={styles.bundleTitle}>{bundle.title}</h3>
        {bundle.description ? <p className={styles.bundleText}>{bundle.description}</p> : null}
      </div>
      <div className={styles.priceRow}>
        <b className={styles.price}>{formatMoney(bundle.price)}</b>
        {hasSaving ? <s className={styles.oldPrice}>{formatMoney(bundle.booksTotal)}</s> : null}
        <span className={styles.action}>
          {isUnavailable ? (
            <span className={styles.unavailable}>{text.outOfStock}</span>
          ) : (
            <FeatureGate badge="inline" feature="bundle-add-to-cart" label={messages.site.soon}>
              <button className={styles.addButton} disabled type="button">
                {text.addBundle}
              </button>
            </FeatureGate>
          )}
        </span>
      </div>
    </article>
  );
}

// "العروض" (design/Offers.dc.html): banner, the book bundles and the discounted books. Every price, the saving and the
// stock status are the API's. The coupons list and the countdown of the design have no public API, so they are left out.
export function OffersView({
  bundles,
  discounted,
}: {
  bundles: BundlesResult;
  discounted: DiscountedBooksResult;
}) {
  const text = messages.offers;
  const hasNothing = bundles.status === 'empty' && discounted.status === 'empty';

  return (
    <div className={styles.page}>
      <section className={styles.banner}>
        <h1>{text.heading}</h1>
        <p>{text.intro}</p>
      </section>

      {hasNothing ? (
        <EmptyState description={text.emptyDescription} icon="tag" title={text.emptyTitle} />
      ) : null}

      {bundles.status === 'ok' ? (
        <section aria-labelledby="bundles-heading" className={styles.block}>
          <div className={styles.head}>
            <h2 id="bundles-heading">{text.bundlesTitle}</h2>
            <p>{text.bundlesSubtitle}</p>
          </div>
          <ul aria-label={text.bundlesLabel} className={styles.bundles}>
            {bundles.items.map((bundle) => (
              <li key={bundle.slug}>
                <BundleCard bundle={bundle} />
              </li>
            ))}
          </ul>
        </section>
      ) : bundles.status === 'error' ? (
        <div className={styles.message} role="alert">
          <p>{text.bundlesError}</p>
        </div>
      ) : null}

      {discounted.status === 'ok' ? (
        <section aria-labelledby="discounted-heading" className={styles.block}>
          <div className={`${styles.head} ${styles.headRow}`}>
            <h2 id="discounted-heading">{text.discountedTitle}</h2>
            <Link className={styles.viewAll} href={routes.books}>
              {text.viewAll}
              <Icon name="arrow" size="sm" />
            </Link>
          </div>
          <BookGrid items={discounted.items} />
        </section>
      ) : discounted.status === 'error' ? (
        <div className={styles.message} role="alert">
          <p>{text.discountedError}</p>
        </div>
      ) : null}
    </div>
  );
}
