import messages from '@/i18n/messages/ar.json';
import { formatNumber } from '@/shared/lib/format';
import { FeatureGate } from '@/shared/ui/soon';

import { getBookReviews, type BookReviewsResult } from '../api/reviews-api';
import { ReviewStars } from './review-stars';
import { ReviewsList } from './reviews-list';
import styles from './reviews.module.css';
import { ReviewsSort } from './reviews-sort';
import { WriteReview } from './write-review';

export type BookReviewsProps = {
  slug: string;
  bookId: number;
  /** From the book DTO: the API's average and count. Nothing is computed here. */
  ratingAverage: number | null;
  ratingCount: number;
  /** Renders a ready result without calling the API (dev preview page and tests only). */
  fixture?: BookReviewsResult;
};

// "آراء القراء": the rating summary and the approved reviews (server-rendered), plus the write-a-review action.
export async function BookReviews({
  slug,
  bookId,
  ratingAverage,
  ratingCount,
  fixture,
}: BookReviewsProps) {
  const text = messages.reviews;
  const result = fixture ?? (await getBookReviews(slug));
  const hasRating = ratingCount > 0 && typeof ratingAverage === 'number';

  return (
    <FeatureGate feature="reviews-section" label={messages.site.soon} whenSoon="hide">
      <section aria-labelledby="reviews-heading" className={styles.section} id="reviews">
        <div className={styles.layout}>
          <div>
            <h2 className={styles.heading} id="reviews-heading">
              {text.title}
            </h2>
            <div className={`${styles.card} ${styles.summary}`}>
              {hasRating ? (
                <div className={styles.score}>
                  <span className={styles.average}>{formatNumber(ratingAverage)}</span>
                  <div className={styles.scoreText}>
                    <ReviewStars rating={ratingAverage} />
                    <span>{text.basedOn.replace('{count}', formatNumber(ratingCount))}</span>
                  </div>
                </div>
              ) : null}
              <WriteReview bookId={bookId} />
            </div>
          </div>

          <div>
            <div className={styles.listHead}>
              <h3 className={styles.listHeading}>{text.listHeading}</h3>
              <FeatureGate badge="inline" feature="review-sort" label={messages.site.soon}>
                <ReviewsSort />
              </FeatureGate>
            </div>
            {result.status === 'error' ? (
              <div className={`${styles.message} ${styles.errorMessage}`} role="alert">
                <p>{text.loadError}</p>
              </div>
            ) : result.page.items.length === 0 ? (
              <div className={styles.message}>
                <h4 className={styles.emptyTitle}>{text.emptyTitle}</h4>
                <p>{text.emptyDescription}</p>
              </div>
            ) : (
              <ReviewsList initial={result.page} slug={slug} />
            )}
          </div>
        </div>
      </section>
    </FeatureGate>
  );
}
