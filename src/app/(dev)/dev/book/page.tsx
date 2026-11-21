import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import messages from '@/i18n/messages/ar.json';
import { buildBookBreadcrumbJsonLd, buildBookJsonLd } from '@/modules/books-seo';
import { BookDetailsView } from '@/modules/catalog';
import { BookReviews, type BookReviewsResult, type PublicReview } from '@/modules/reviews';
import { JsonLd } from '@/shared/seo';

import { buildDevBookData, parseDevBookState, type DevBookState } from './book-fixtures';
import styles from './book.module.css';

export const metadata: Metadata = {
  title: 'Book details (dev)',
  robots: { index: false, follow: false },
};

const BASE_PATH = '/dev/book';

// Reviews preview (?reviews=list|empty|error): fixtures only, so the section can be seen without an API.
const reviewText = messages.devBook.reviewFixtures;
const devReviews: readonly PublicReview[] = [
  {
    displayName: reviewText.firstName,
    rating: 5,
    comment: reviewText.firstComment,
    createdAt: '2026-09-20T10:00:00Z',
  },
  {
    displayName: reviewText.secondName,
    rating: 4,
    comment: reviewText.secondComment,
    createdAt: '2026-06-12T10:00:00Z',
  },
];

function devReviewsFixture(raw: string | string[] | undefined): BookReviewsResult | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === 'error') return { status: 'error' };
  if (value === 'empty') {
    return { status: 'ok', page: { items: [], page: 1, pageSize: 48, totalCount: 0 } };
  }
  if (value === 'list') {
    return {
      status: 'ok',
      page: { items: [...devReviews], page: 1, pageSize: 48, totalCount: 2, hasNextPage: false },
    };
  }
  return undefined;
}

type PresetEntry = {
  key: DevBookState;
  labelKey: keyof typeof messages.devBook.presets;
  href: string;
};

const presets: readonly PresetEntry[] = [
  { key: 'in-stock', labelKey: 'inStock', href: BASE_PATH },
  { key: 'discounted', labelKey: 'discounted', href: `${BASE_PATH}?state=discounted` },
  { key: 'low-stock', labelKey: 'lowStock', href: `${BASE_PATH}?state=low-stock` },
  { key: 'out-of-stock', labelKey: 'outOfStock', href: `${BASE_PATH}?state=out-of-stock` },
  {
    key: 'with-translator',
    labelKey: 'withTranslator',
    href: `${BASE_PATH}?state=with-translator`,
  },
  { key: 'long-title', labelKey: 'longTitle', href: `${BASE_PATH}?state=long-title` },
  { key: 'no-cover', labelKey: 'noCover', href: `${BASE_PATH}?state=no-cover` },
  { key: 'no-description', labelKey: 'noDescription', href: `${BASE_PATH}?state=no-description` },
  { key: 'no-related', labelKey: 'noRelated', href: `${BASE_PATH}?state=no-related` },
];

type DevBookPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

// Development reference page for Book details (/books/[slug]) states. Returns 404 in production.
export default async function DevBookPage({ searchParams }: DevBookPageProps = {}) {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  const resolvedParams = searchParams ? await searchParams : {};
  const state = parseDevBookState(resolvedParams.state);
  const { book, relatedBooks } = buildDevBookData(state);
  const reviewsFixture = devReviewsFixture(resolvedParams.reviews);
  const text = messages.devBook;

  return (
    <main className={styles.page} id="main-content">
      <nav aria-label={text.presetsLabel} className={styles.toolbar}>
        <div className={styles.toolbarInner}>
          <span className={styles.toolbarTitle}>{text.title}</span>
          <ul className={styles.presetList}>
            {presets.map((preset) => (
              <li key={preset.key}>
                <Link
                  aria-current={state === preset.key ? 'page' : undefined}
                  className={styles.presetLink}
                  href={preset.href}
                >
                  {text.presets[preset.labelKey]}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className={styles.content}>
        <JsonLd data={buildBookJsonLd(book)} />
        <JsonLd data={buildBookBreadcrumbJsonLd(book)} />
        <BookDetailsView book={book} relatedBooks={relatedBooks} />
        {reviewsFixture ? (
          <BookReviews
            bookId={book.id}
            fixture={reviewsFixture}
            ratingAverage={
              reviewsFixture.status === 'ok' && reviewsFixture.page.items.length > 0 ? 4.8 : null
            }
            ratingCount={reviewsFixture.status === 'ok' ? reviewsFixture.page.items.length : 0}
            slug="dev"
          />
        ) : null}
      </div>
    </main>
  );
}
