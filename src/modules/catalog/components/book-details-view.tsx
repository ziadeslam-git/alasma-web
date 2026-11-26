import { Fragment, type CSSProperties, type ReactNode } from 'react';

import messages from '@/i18n/messages/ar.json';
import { AddToCartButton } from '@/modules/cart';
import { WishlistHeart } from '@/modules/wishlist';
import { isLive, type FeatureKey } from '@/shared/config/features';
import { authorRoute, categoryRoute, routes } from '@/shared/config/routes';
import { formatDiscountBadge, formatMoney, formatNumber, formatYear } from '@/shared/lib/format';
import { Breadcrumbs, type BreadcrumbItem } from '@/shared/ui/breadcrumbs';
import { EmptyState } from '@/shared/ui/empty-state';
import { Icon } from '@/shared/ui/icon';
import { FeatureGate, FeatureLink } from '@/shared/ui/soon';

import type { BookCardItem, BookDetails } from '../types';
import { BookDetailsCover } from './book-details-cover';
import { BookGrid } from './book-grid';
import styles from './book-details-view.module.css';

const extraOptionFeatures: readonly FeatureKey[] = [
  'book-sample-pdf',
  'book-short-link',
  'book-report-error',
];

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
      feature: 'catalog-categories',
    });
  }
  breadcrumbItems.push({ label: book.title });

  const authors = book.authors.filter((a) => a.role === 'Author' || !a.role);
  const displayAuthors = authors.length > 0 ? authors : book.authors;
  const translators = book.authors.filter((a) => a.role === 'Translator');

  const authorNames = displayAuthors.map((a) => a.name).join(messages.catalog.authorSeparator);
  const coverTypeLabel = book.coverType
    ? (text.specs.coverTypes[book.coverType as keyof typeof text.specs.coverTypes] ??
      book.coverType)
    : undefined;
  // The rating row exists only for a book that really has ratings (the API sends null / 0 otherwise).
  const rating =
    book.ratingCount > 0 && typeof book.ratingAverage === 'number' ? book.ratingAverage : undefined;

  // "خيارات إضافية" holds only soon actions today (none has a destination or handler), so the heading and its column
  // are dropped while none of them is live, leaving no orphaned heading or empty grid track.
  const hasExtraOptions = extraOptionFeatures.some(isLive);

  // The author card of the design: shown only for an author whose short bio the API returns.
  const aboutAuthor = displayAuthors.find((a) => a.shortBio);
  const aboutAuthorInitial = aboutAuthor ? Array.from(aboutAuthor.name.trim())[0] : undefined;

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
      value: authorNames,
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
      value: formatYear(book.publishYear),
    });
  }

  if (coverTypeLabel) {
    specRows.push({ key: 'coverType', label: text.specs.coverType, value: coverTypeLabel });
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
          {/* Task 70: the cover fills a 2:3 frame edge to edge, like the book card (Task 61). Sample and share are soon
              and hidden here (whenSoon="hide") rather than shown dimmed. */}
          <div className={styles.coverFrame}>
            <BookDetailsCover
              author={authorNames || undefined}
              className={styles.cover}
              imageUrl={book.coverImageUrl}
              title={book.title}
              variantKey={book.slug}
            />
          </div>

          <div className={styles.coverActions}>
            <FeatureGate feature="book-sample-pdf" label={soonLabel} whenSoon="hide">
              <button className={styles.actionLink} disabled type="button">
                <Icon name="eye" size="sm" />
                <span>{text.actions.sample}</span>
              </button>
            </FeatureGate>
            <FeatureGate feature="book-short-link" label={soonLabel} whenSoon="hide">
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
                  <Fragment key={author.name}>
                    {index > 0 ? messages.catalog.authorSeparator : null}
                    {author.pageSlug ? (
                      <FeatureLink
                        className={styles.authorLink}
                        feature="catalog-authors"
                        href={authorRoute(author.pageSlug)}
                        label={soonLabel}
                      >
                        {author.name}
                      </FeatureLink>
                    ) : (
                      <span className={styles.authorLink}>{author.name}</span>
                    )}
                  </Fragment>
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

            {rating !== undefined ? (
              <div className={styles.ratingRow}>
                <span
                  aria-label={text.rating.label.replace('{rating}', formatNumber(rating))}
                  className={styles.stars}
                  role="img"
                  style={{ '--rating': rating } as CSSProperties}
                />
                <b>{formatNumber(rating)}</b>
                <span aria-hidden="true">·</span>
                <span>{text.rating.count.replace('{count}', formatNumber(book.ratingCount))}</span>
              </div>
            ) : null}
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

          {coverTypeLabel ? (
            <div aria-label={text.formats.legend} className={styles.formatsGroup} role="group">
              <div className={`${styles.formatOption} ${styles.formatSelected}`}>
                <em className={styles.formatBadge}>{text.formats.selected}</em>
                <b className={styles.formatTitle}>{coverTypeLabel}</b>
              </div>
            </div>
          ) : null}

          <div className={styles.stockStatus}>
            {isOutOfStock ? (
              <span className={`${styles.stockStatus} ${styles.stockOut}`}>
                {text.stock.outOfStock}
              </span>
            ) : isLowStock ? (
              <span className={`${styles.stockStatus} ${styles.stockLow}`}>
                {/* no bell here: it is the notify-me icon (reservations-notify-me, hidden while soon), and a bell beside
                    "order now" read as a notification control that does nothing (Task 84) */}
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
              <FeatureGate feature="reservations-notify-me" label={soonLabel} whenSoon="hide">
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
                <AddToCartButton
                  bookId={book.id}
                  className={`${styles.optionBtn} ${styles.primaryAction}`}
                  title={book.title}
                  showText
                />

                <FeatureGate feature="buy-now" label={soonLabel} whenSoon="hide">
                  <button
                    className={`${styles.optionBtn} ${styles.secondaryAction}`}
                    disabled
                    type="button"
                  >
                    <span>{text.actions.buyNow}</span>
                  </button>
                </FeatureGate>
              </>
            )}

            <FeatureGate feature="wishlist-heart" label={soonLabel} whenSoon="hide">
              <WishlistHeart
                bookId={book.id}
                className={`${styles.optionBtn} ${styles.iconAction}`}
                title={book.title}
              />
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

      {specRows.length > 0 ? (
        <section aria-labelledby="specs-heading" className={styles.specsSection}>
          <div className={hasExtraOptions ? styles.specsLayout : undefined}>
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
                          <td className={styles.specsTd}>
                            {row.dir === 'ltr' ? <bdi dir="ltr">{row.value}</bdi> : row.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>

            {hasExtraOptions ? (
              <div className={styles.extraOptions}>
                <h2 className={styles.sectionHeading}>{text.extraOptions.heading}</h2>
                <FeatureGate feature="book-sample-pdf" label={soonLabel} whenSoon="hide">
                  <button className={styles.optionBtn} disabled type="button">
                    <Icon name="eye" size="sm" />
                    <span>{text.extraOptions.samplePdf}</span>
                  </button>
                </FeatureGate>
                <FeatureGate feature="book-short-link" label={soonLabel} whenSoon="hide">
                  <button className={styles.optionBtn} disabled type="button">
                    <Icon name="share" size="sm" />
                    <span>{text.extraOptions.shortLink}</span>
                  </button>
                </FeatureGate>
                <FeatureGate feature="book-report-error" label={soonLabel} whenSoon="hide">
                  <button className={styles.actionLink} disabled type="button">
                    <Icon name="help" size="sm" />
                    <span>{text.extraOptions.reportError}</span>
                  </button>
                </FeatureGate>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {aboutAuthor ? (
        <section aria-labelledby="about-author-heading" className={styles.authorSection}>
          <div className={styles.authorCard}>
            <div aria-hidden="true" className={styles.authorAvatar}>
              {aboutAuthorInitial}
            </div>
            <div className={styles.authorBody}>
              <h2 className={styles.authorHeading} id="about-author-heading">
                {text.aboutAuthor.heading}
              </h2>
              {aboutAuthor.pageSlug ? (
                <FeatureLink
                  className={styles.authorLink}
                  feature="catalog-authors"
                  href={authorRoute(aboutAuthor.pageSlug)}
                  label={soonLabel}
                >
                  {aboutAuthor.name}
                </FeatureLink>
              ) : (
                <span className={styles.authorLink}>{aboutAuthor.name}</span>
              )}
              <p className={styles.authorBio}>{aboutAuthor.shortBio}</p>
              {aboutAuthor.pageSlug ? (
                <FeatureLink
                  className={styles.authorAllLink}
                  feature="catalog-authors"
                  href={authorRoute(aboutAuthor.pageSlug)}
                  label={soonLabel}
                >
                  <span>{text.aboutAuthor.allBooks.replace('{name}', aboutAuthor.name)}</span>
                  <Icon name="arrow" size="sm" />
                </FeatureLink>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

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
