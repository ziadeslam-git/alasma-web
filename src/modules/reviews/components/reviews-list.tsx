'use client';

import { useState } from 'react';

import messages from '@/i18n/messages/ar.json';
import { ApiError, getApiErrorMessage } from '@/shared/lib/api';
import { formatDate } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { FeatureGate } from '@/shared/ui/soon';

import { loadMoreReviews, type PublicReview, type ReviewsPage } from '../api/reviews-api';
import { ReviewStars } from './review-stars';
import styles from './reviews.module.css';

function ReviewItem({ review }: { review: PublicReview }) {
  const text = messages.reviews;
  return (
    <li className={`${styles.card} ${styles.review}`}>
      <div className={styles.reviewHead}>
        <span aria-hidden="true" className={styles.avatar}>
          {Array.from(review.displayName)[0] ?? ''}
        </span>
        <div className={styles.reviewer}>
          <b className={styles.reviewerName}>{review.displayName}</b>
          <span className={styles.reviewMeta}>
            <ReviewStars rating={review.rating} small />
            <time dateTime={review.createdAt}>{formatDate(review.createdAt)}</time>
          </span>
        </div>
      </div>
      {review.comment ? <p className={styles.comment}>{review.comment}</p> : null}
      <FeatureGate feature="review-helpful" label={messages.site.soon} whenSoon="hide">
        <div className={styles.reviewActions}>
          <button className={styles.reviewAction} disabled type="button">
            {text.helpful}
          </button>
          <button className={styles.reviewAction} disabled type="button">
            {text.report}
          </button>
        </div>
      </FeatureGate>
    </li>
  );
}

// The first page is rendered on the server; "show more" reads the next ones in the browser, so the book page stays static.
export function ReviewsList({ slug, initial }: { slug: string; initial: ReviewsPage }) {
  const text = messages.reviews;
  const [reviews, setReviews] = useState<readonly PublicReview[]>(initial.items);
  const [page, setPage] = useState(initial.page);
  const [hasNext, setHasNext] = useState(initial.hasNextPage ?? false);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function more() {
    if (isLoading) return;
    setLoading(true);
    setError('');
    try {
      const next = await loadMoreReviews(slug, page + 1);
      setReviews((current) => [...current, ...next.items]);
      setPage(next.page);
      setHasNext(next.hasNextPage ?? false);
    } catch (cause) {
      setError(cause instanceof ApiError ? getApiErrorMessage(cause) : text.loadError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <ul aria-label={text.listLabel} className={styles.list}>
        {reviews.map((review, index) => (
          <ReviewItem key={`${review.createdAt}-${review.displayName}-${index}`} review={review} />
        ))}
      </ul>
      {error ? (
        <p className={styles.formError} role="alert">
          {error}
        </p>
      ) : null}
      {hasNext ? (
        <div className={styles.more}>
          <Button loading={isLoading} onClick={() => void more()} variant="outline">
            {isLoading ? text.loadingMore : text.loadMore}
          </Button>
        </div>
      ) : null}
    </>
  );
}
