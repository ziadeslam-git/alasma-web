import { getApiClient } from '@/modules/auth';
import {
  createServerClient,
  nextFetch,
  throwIfError,
  type ServerClientOptions,
  type components,
} from '@/shared/lib/api';

export type PublicReview = components['schemas']['PublicReviewDto'];
export type ReviewsPage = components['schemas']['PagedResultOfPublicReviewDto'];
export type CreatedReview = components['schemas']['ReviewDto'];

// Limits of the API contract (CreateReviewRequestValidator: rating 1..5, comment at most 2000 characters).
export const REVIEW_MIN_RATING = 1;
export const REVIEW_MAX_RATING = 5;
export const REVIEW_COMMENT_MAX_LENGTH = 2000;
export const REVIEWS_PAGE_SIZE = 48;

export const REVIEWS_REVALIDATE_SECONDS = 300;
export const REVIEWS_CACHE_TAG = 'reviews';

export type BookReviewsResult = { status: 'ok'; page: ReviewsPage } | { status: 'error' };

// First page of the approved reviews, read on the server for the (cached) book page. A failure must not break the
// book page, so it becomes a result the section can show as a small error.
export async function getBookReviews(
  slug: string,
  options: ServerClientOptions = {},
): Promise<BookReviewsResult> {
  try {
    const result = await createServerClient(options).GET('/api/v1/books/{slug}/reviews', {
      params: { path: { slug }, query: { page: 1, pageSize: REVIEWS_PAGE_SIZE } },
      ...nextFetch({ revalidate: REVIEWS_REVALIDATE_SECONDS, tags: [REVIEWS_CACHE_TAG] }),
    });
    if (result.error) throwIfError(result);
    return result.data ? { status: 'ok', page: result.data } : { status: 'error' };
  } catch {
    return { status: 'error' };
  }
}

// The next pages are read in the browser ("show more"), so the book page itself stays static.
export async function loadMoreReviews(slug: string, page: number): Promise<ReviewsPage> {
  const result = await getApiClient().GET('/api/v1/books/{slug}/reviews', {
    params: { path: { slug }, query: { page, pageSize: REVIEWS_PAGE_SIZE } },
    cache: 'no-store',
  });
  if (!result.data) throw new Error('Missing reviews response');
  return result.data;
}

// 201 with the review in Pending state: it is public only after a moderator approves it.
export async function createReview(
  bookId: number,
  review: { rating: number; comment: string | null },
): Promise<CreatedReview> {
  const result = await getApiClient().POST('/api/v1/books/{id}/reviews', {
    params: { path: { id: bookId } },
    body: review,
  });
  if (!result.data) throw new Error('Missing review response');
  return result.data;
}
