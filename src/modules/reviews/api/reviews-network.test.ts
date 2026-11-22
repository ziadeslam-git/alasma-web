import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { server } from '@/mocks/server';
import { ApiError } from '@/shared/lib/api';

vi.mock('@/modules/auth', async () => {
  const { createBrowserClient } = await import('@/shared/lib/api');
  return {
    getApiClient: () =>
      createBrowserClient({ getAccessToken: () => 'token' }, { baseUrl: 'http://localhost' }),
  };
});
import { createReview, getBookReviews, loadMoreReviews } from './reviews-api';

const base = 'http://localhost/api/v1';

describe('reviews API: network failure', () => {
  it('turns a dropped connection on the server read into an error result', async () => {
    server.use(http.get(`${base}/books/:slug/reviews`, () => HttpResponse.error()));

    await expect(getBookReviews('book', { origin: 'http://localhost' })).resolves.toEqual({
      status: 'error',
    });
  });

  it.each([
    ['load more', () => loadMoreReviews('book', 2)],
    ['create', () => createReview(1, { rating: 4, comment: null })],
  ])('rejects %s with an ApiError of kind network', async (_name, call) => {
    server.use(
      http.get(`${base}/books/:slug/reviews`, () => HttpResponse.error()),
      http.post(`${base}/books/:id/reviews`, () => HttpResponse.error()),
    );

    const error = await call().catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).kind).toBe('network');
  });
});
