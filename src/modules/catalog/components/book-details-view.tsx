import Link from 'next/link';
import type { ReactNode } from 'react';

import messages from '@/i18n/messages/ar.json';
import { authorRoute, categoryRoute, routes } from '@/shared/config/routes';
import { formatDiscountBadge, formatMoney, formatNumber } from '@/shared/lib/format';
import { BookCover } from '@/shared/ui/book-cover';
import { Breadcrumbs, type BreadcrumbItem } from '@/shared/ui/breadcrumbs';
import { EmptyState } from '@/shared/ui/empty-state';
import { Icon } from '@/shared/ui/icon';
import { FeatureGate } from '@/shared/ui/soon';

import type { BookCardItem, BookDetails } from '../types';
import { BookGrid } from './book-grid';
import styles from './book-details-view.module.css';

export type BookDetailsViewProps = {
  book: BookDetails;
  relatedBooks?: readonly BookCardItem[];
  children?: ReactNode;
};

export function BookDetailsView({ book, relatedBooks = [], children }: BookDetailsViewProps) {
  const text = messages.catalog.detail;
  const soonLabel = messages.site.soon;

  const primaryCategory = book.categories.find((c) => c.isPrimary) ?? book.categories[0];
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: messages.site.header.home, href: routes.home },
    { label: messages.site.header.store, href: routes.books },
  ];

  if (primaryCategory) {
    breadcrumbItems.push({
      label: primaryCategory.name,
      href: categoryRoute(primaryCategory.slug),
    });
  }
  breadcrumbItems.push({ label: book.title });

  const authors = book.authors.filter((a) => a.role === 'Author' || !a.role);
  const displayAuthors = authors.length > 0 ? authors : book.authors;
  const translators = book.authors.filter((a) => a.role === 'Translator');

  const hasDiscount = book.discountPercent > 0 && book.finalPrice < book.price;
  const isOutOfStock = book.stockStatus === 'OutOfStock';
  const isLowStock = book.stockStatus === 'LowStock';

  // Build specifications list - strictly omit any row without data
  const specRows: Array<{ key: string; label: string; value: string; dir?: 'ltr' }> = [];

  if (book.isbn) {
    specRows.push({ key: 'isbn', label: text.specs.isbn, value: book.isbn, dir: 'ltr' });
  }

  if (displayAuthors.length > 0) {
    specRows.push({
      key: 'author',
      label: text.specs.author,
      value: displayAuthors.map((a) => a.name).join(messages.catalog.authorSeparator),
    });
  }

  if (translators.length > 0) {
    specRows.push({
      key: 'translator',
      label: text.specs.translator,
      value: translators.map((t) => t.name).join(messages.catalog.authorSeparator),
    });
  }

  if (book.publisher?.name) {
    specRows.push({ key: 'publisher', label: text.specs.publisher, value: book.publisher.name });
  }

  if (book.publishYear) {
    specRows.push({
      key: 'publishYear',
      label: text.specs.publishYear,
      value: formatNumber(book.publishYear),
    });
  }

  if (book.coverType) {
    const coverLabel =
      book.coverType === 'Paperback'
        ? text.specs.coverTypes.Paperback
        : book.coverType === 'Hardcover'
          ? text.specs.coverTypes.Hardcover
          : book.coverType;
    specRows.push({ key: 'coverType', label: text.specs.coverType, value: coverLabel });
  }

  if (book.pageCount) {
    specRows.push({
      key: 'pageCount',
      label: text.specs.pageCount,
      value: formatNumber(book.pageCount),
    });
  }

  if (book.language) {
    const langLabel =
      book.language === 'Arabic'
        ? text.specs.languages.Arabic
        : book.language === 'English'
          ? text.specs.languages.English
          : text.specs.languages.Other;
    specRows.push({ key: 'language', label: text.specs.language, value: langLabel });
  }

  return (
    <div className={styles.container}>
      <Breadcrumbs items={breadcrumbItems} label={text.breadcrumbsLabel} />

      <section aria-labelledby="book-title" className={styles.hero}>
        <div className={styles.figureColumn}>
          <div className={styles.coverContainer}>
            <div className={styles.coverInner}>
              <BookCover
                as="div"
                imageUrl={book.coverImageUrl}
                priority
                title={book.title}
                variantKey={book.slug}
              />
            </div>
          </div>

          <div className={styles.coverActions}>
            <FeatureGate feature="book-sample-pdf" label={soonLabel}>
              <button className={styles.actionLink} disabled type="button">
                <Icon name="eye" size="sm" />
                <span>{text.actions.sample}</span>
              </button>
            </FeatureGate>
            <FeatureGate feature="book-short-link" label={soonLabel}>
              <button className={styles.actionLink} disabled type="button">
                <Icon name="share" size="sm" />
                <span>{text.actions.share}</span>
              </button>
            </FeatureGate>
          </div>
        </div>

        <div className={styles.infoColumn}>
          <h1 className={styles.title} id="book-title">
            {book.title}
          </h1>

          <div className={styles.byline}>
            {displayAuthors.length > 0 ? (
              <div>
                <span>{text.authorPrefix}</span>
                {displayAuthors.map((author, index) => (
                  <span key={author.name}>
                    {index > 0 ? messages.catalog.authorSeparator : null}
                    {author.pageSlug ? (
                      <Link className={styles.authorLink} href={authorRoute(author.pageSlug)}>
                        {author.name}
                      </Link>
                    ) : (
                      <span className={styles.authorLink}>{author.name}</span>
                    )}
                  </span>
                ))}
              </div>
            ) : null}

            {translators.length > 0 ? (
              <div>
                <span>{text.translatorPrefix}</span>
                {translators.map((t, index) => (
                  <span key={t.name}>
                    {index > 0 ? messages.catalog.authorSeparator : null}
                    <span>{t.name}</span>
                  </span>
                ))}
              </div>
            ) : null}

            <FeatureGate feature="reviews-section" label={soonLabel}>
              <div className={styles.ratingRow}>
                <Icon name="sparkle" size="sm" />
                <b>{text.reviews.rating}</b>
                <span>·</span>
                <span>{text.reviews.summary}</span>
              </div>
            </FeatureGate>
          </div>

          <div className={styles.priceBlock}>
            <span className={styles.finalPrice}>{formatMoney(book.finalPrice)}</span>
            {hasDiscount ? <s className={styles.oldPrice}>{formatMoney(book.price)}</s> : null}
            {hasDiscount ? (
              <span className={styles.discountBadge}>
                {formatDiscountBadge(book.discountPercent, text.savePercent)}
              </span>
            ) : null}
          </div>

          <FeatureGate feature="ebook-format" label={soonLabel}>
            <div aria-label={text.formats.legend} className={styles.formatsGroup} role="group">
              <div className={`${styles.formatOption} ${styles.formatSelected}`}>
                <b className={styles.formatTitle}>
                  {book.coverType === 'Paperback' ? text.formats.paperback : text.formats.hardcover}
                </b>
                <span className={styles.formatPrice}>{formatMoney(book.finalPrice)}</span>
              </div>
              <div className={styles.formatOption}>
                <b className={styles.formatTitle}>{text.formats.paperback}</b>
                <span className={styles.formatPrice}>{formatMoney(book.finalPrice)}</span>
              </div>
              <div className={styles.formatOption}>
                <b className={styles.formatTitle}>{text.formats.ebook}</b>
                <span className={styles.formatPrice}>{formatMoney(book.finalPrice)}</span>
              </div>
            </div>
          </FeatureGate>

          <div className={styles.stockStatus}>
            {isOutOfStock ? (
              <span className={`${styles.stockStatus} ${styles.stockOut}`}>
                {text.stock.outOfStock}
              </span>
            ) : isLowStock ? (
              <span className={`${styles.stockStatus} ${styles.stockLow}`}>
                <Icon name="bell" size="sm" />
                <span>{text.stock.lowStock}</span>
              </span>
            ) : (
              <span className={`${styles.stockStatus} ${styles.stockIn}`}>
                <Icon name="check-c" size="sm" />
                <span>{text.stock.inStock}</span>
              </span>
            )}
          </div>

          <div className={styles.descriptionBlock}>
            {book.description ? (
              <p className={styles.description}>{book.description}</p>
            ) : (
              <EmptyState
                description={text.description.emptyDescription}
                headingLevel={2}
                icon="book"
                title={text.description.emptyTitle}
              />
            )}
          </div>

          <div className={styles.actionsRow}>
            {isOutOfStock ? (
              <FeatureGate feature="reservations-notify-me" label={soonLabel}>
                <button
                  className={`${styles.optionBtn} ${styles.primaryAction}`}
                  disabled
                  type="button"
                >
                  <Icon name="bell" size="sm" />
                  <span>{text.actions.notifyMe}</span>
                </button>
              </FeatureGate>
            ) : (
              <>
                <FeatureGate feature="cart-page" label={soonLabel}>
                  <div className={styles.qtyPicker}>
                    <button
                      aria-label={text.actions.decreaseQty}
                      className={styles.qtyBtn}
                      disabled
                      type="button"
                    >
                      <Icon name="minus" size="sm" />
                    </button>
                    <span className={styles.qtyValue}>1</span>
                    <button
                      aria-label={text.actions.increaseQty}
                      className={styles.qtyBtn}
                      disabled
                      type="button"
                    >
                      <Icon name="plus" size="sm" />
                    </button>
                  </div>
                </FeatureGate>

                <FeatureGate feature="cart-page" label={soonLabel}>
                  <button
                    aria-label={messages.catalog.addToCart.replace('{title}', book.title)}
                    className={`${styles.optionBtn} ${styles.primaryAction}`}
                    disabled
                    type="button"
                  >
                    <Icon name="bag" size="sm" />
                    <span>{text.actions.addToCart}</span>
                  </button>
                </FeatureGate>

                <FeatureGate feature="checkout-flow" label={soonLabel}>
                  <button className={styles.optionBtn} disabled type="button">
                    <span>{text.actions.buyNow}</span>
                  </button>
                </FeatureGate>
              </>
            )}

            <FeatureGate feature="wishlist-heart" label={soonLabel}>
              <button
                aria-label={messages.catalog.addToWishlist.replace('{title}', book.title)}
                className={styles.optionBtn}
                disabled
                type="button"
              >
                <Icon name="heart" size="sm" />
              </button>
            </FeatureGate>
          </div>

          <div className={styles.trustRow}>
            <span className={styles.trustItem}>
              <Icon name="truck" size="sm" />
              <span>{text.trust.shipping}</span>
            </span>
            <span className={styles.trustItem}>
              <Icon name="wallet" size="sm" />
              <span>{text.trust.payment}</span>
            </span>
          </div>
        </div>
      </section>

      {specRows.length > 0 || book.categories.length > 0 ? (
        <section aria-labelledby="specs-heading" className={styles.specsSection}>
          <div className={styles.specsLayout}>
            <div>
              <h2 className={styles.sectionHeading} id="specs-heading">
                {text.specs.heading}
              </h2>
              {specRows.length > 0 ? (
                <div className={styles.specsCard}>
                  <table className={styles.specsTable}>
                    <tbody>
                      {specRows.map((row) => (
                        <tr key={row.key} className={styles.specsTableRow}>
                          <th className={styles.specsTh} scope="row">
                            {row.label}
                          </th>
                          <td className={styles.specsTd} dir={row.dir}>
                            {row.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {book.categories.length > 0 ? (
                <div className={styles.tagChips}>
                  {book.categories.map((category) => (
                    <Link
                      key={category.id}
                      className={styles.chip}
                      href={categoryRoute(category.slug)}
                    >
                      #{category.name}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>

            <div className={styles.extraOptions}>
              <h2 className={styles.sectionHeading}>{text.extraOptions.heading}</h2>
              <FeatureGate feature="book-sample-pdf" label={soonLabel}>
                <button className={styles.optionBtn} disabled type="button">
                  <Icon name="eye" size="sm" />
                  <span>{text.extraOptions.samplePdf}</span>
                </button>
              </FeatureGate>
              <FeatureGate feature="book-short-link" label={soonLabel}>
                <button className={styles.optionBtn} disabled type="button">
                  <Icon name="share" size="sm" />
                  <span>{text.extraOptions.shortLink}</span>
                </button>
              </FeatureGate>
              <FeatureGate feature="book-report-error" label={soonLabel}>
                <button className={styles.actionLink} disabled type="button">
                  <Icon name="help" size="sm" />
                  <span>{text.extraOptions.reportError}</span>
                </button>
              </FeatureGate>
            </div>
          </div>
        </section>
      ) : null}

      <FeatureGate feature="reviews-section" label={soonLabel}>
        <section aria-labelledby="reviews-heading" className={styles.reviewsSection}>
          <h2 className={styles.sectionHeading} id="reviews-heading">
            {text.reviews.heading}
          </h2>
          <div className={styles.specsCard}>
            <p className={styles.description}>{text.reviews.summary}</p>
          </div>
        </section>
      </FeatureGate>

      {relatedBooks.length > 0 ? (
        <section aria-labelledby="related-heading" className={styles.relatedSection}>
          <h2 className={styles.sectionHeading} id="related-heading">
            {text.related.heading}
          </h2>
          <BookGrid items={relatedBooks} />
        </section>
      ) : null}
      {children}
    </div>
  );
}
