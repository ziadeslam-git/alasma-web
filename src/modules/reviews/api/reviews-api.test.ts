import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { server } from '@/mocks/server';
import { ApiError, getApiErrorMessage } from '@/shared/lib/api';

import { createReview, getBookReviews, loadMoreReviews } from './reviews-api';

vi.mock('@/modules/auth', async () => {
  const { createBrowserClient } = await import('@/shared/lib/api');
  return {
    getApiClient: () =>
      createBrowserClient({ getAccessToken: () => 'token' }, { baseUrl: 'http://localhost' }),
  };
});

const base = 'http://localhost/api/v1';

const problem = (status: number, code: string) =>
  HttpResponse.json(
    { code, status, title: 'x' },
    { headers: { 'Content-Type': 'application/problem+json' }, status },
  );

const page = (pageNumber: number, hasNextPage: boolean) => ({
  items: [{ displayName: 'سارة', rating: 5, comment: 'جميل', createdAt: '2026-11-20T10:00:00Z' }],
  page: pageNumber,
  pageSize: 48,
  totalCount: 60,
  totalPages: 2,
  hasNextPage,
  hasPreviousPage: pageNumber > 1,
});

describe('reviews API', () => {
  it('reads the first page on the server and the next pages in the browser', async () => {
    const queries: string[] = [];
    server.use(
      http.get(`${base}/books/:slug/reviews`, ({ request }) => {
        const url = new URL(request.url);
        queries.push(url.search);
        return HttpResponse.json(page(Number(url.searchParams.get('page')), true));
      }),
    );

    const first = await getBookReviews('book-1', { origin: 'http://localhost' });
    const second = await loadMoreReviews('book-1', 2);

    expect(first.status).toBe('ok');
    expect(second.page).toBe(2);
    expect(queries).toEqual(['?page=1&pageSize=48', '?page=2&pageSize=48']);
  });

  it('turns a failed first-page read into an error result instead of throwing', async () => {
    server.use(
      http.get(`${base}/books/:slug/reviews`, () => problem(404, 'review_book_not_found')),
    );

    await expect(getBookReviews('x', { origin: 'http://localhost' })).resolves.toEqual({
      status: 'error',
    });
  });

  it('creates a review and returns it in Pending state', async () => {
    let body: unknown;
    server.use(
      http.post(`${base}/books/:id/reviews`, async ({ request, params }) => {
        body = await request.json();
        return HttpResponse.json(
          {
            id: 9,
            bookId: Number(params.id),
            bookSlug: 'b',
            rating: 4,
            comment: null,
            status: 'Pending',
            createdAt: '2026-11-20T10:00:00Z',
          },
          { status: 201 },
        );
      }),
    );

    const created = await createReview(7, { rating: 4, comment: null });

    expect(body).toEqual({ rating: 4, comment: null });
    expect(created.status).toBe('Pending');
    expect(created.bookId).toBe(7);
  });

  it.each([
    [401, 'review_unauthenticated'],
    [404, 'review_book_not_found'],
    [409, 'review_already_exists'],
    [400, 'review_rating_invalid'],
    [400, 'review_comment_too_long'],
  ])('turns %i %s into an ApiError with an Arabic message', async (status, code) => {
    server.use(http.post(`${base}/books/:id/reviews`, () => problem(status, code)));

    const error = await createReview(1, { rating: 3, comment: null }).catch(
      (cause: unknown) => cause,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe(code);
    expect(getApiErrorMessage(error as ApiError)).toMatch(/[؀-ۿ]/);
    expect(getApiErrorMessage(error as ApiError)).not.toBe(
      getApiErrorMessage(new ApiError({ kind: 'unknown' })),
    );
  });

  it('throws an ApiError for 403, 413 and 429', async () => {
    for (const status of [403, 413, 429]) {
      server.use(http.post(`${base}/books/:id/reviews`, () => problem(status, 'x')));
      const error = await createReview(1, { rating: 3, comment: null }).catch(
        (cause: unknown) => cause,
      );
      expect((error as ApiError).status).toBe(status);
    }
  });
});
