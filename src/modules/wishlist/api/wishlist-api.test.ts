import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { server } from '@/mocks/server';
import { ApiError, getApiErrorMessage } from '@/shared/lib/api';

import { addToWishlist, getWishlist, getWishlistIds, removeFromWishlist } from './wishlist-api';

vi.mock('@/modules/auth', async () => {
  const { createBrowserClient } = await import('@/shared/lib/api');
  return {
    getApiClient: () =>
      createBrowserClient({ getAccessToken: () => 'token' }, { baseUrl: 'http://localhost' }),
  };
});

const base = 'http://localhost/api/v1/wishlist';

const problem = (status: number, code: string) =>
  HttpResponse.json(
    { code, status, title: 'x' },
    { headers: { 'Content-Type': 'application/problem+json' }, status },
  );

const item = {
  id: 7,
  slug: 'book-7',
  title: 'Book',
  coverImageUrl: null,
  authors: ['Author'],
  price: 100,
  finalPrice: 90,
  discountPercent: 10,
  stockStatus: 'InStock',
  isNew: false,
  isFeatured: false,
  addedAt: '2026-11-20T10:00:00Z',
};

describe('wishlist API', () => {
  it('reads one page of the list with the page size cap', async () => {
    let query = '';
    server.use(
      http.get(base, ({ request }) => {
        query = new URL(request.url).search;
        return HttpResponse.json({
          items: [item],
          page: 2,
          pageSize: 48,
          totalCount: 49,
          totalPages: 2,
          hasNextPage: false,
          hasPreviousPage: true,
        });
      }),
    );

    const result = await getWishlist(2);

    expect(query).toBe('?page=2&pageSize=48');
    expect(result.items[0]?.id).toBe(7);
  });

  it('reads the saved ids', async () => {
    server.use(http.get(`${base}/ids`, () => HttpResponse.json({ bookIds: [3, 7] })));

    await expect(getWishlistIds()).resolves.toEqual([3, 7]);
  });

  it('adds and removes a book, and both calls are safe to repeat (204 each time)', async () => {
    const calls: string[] = [];
    server.use(
      http.put(`${base}/:id`, ({ params }) => {
        calls.push(`PUT ${String(params.id)}`);
        return new HttpResponse(null, { status: 204 });
      }),
      http.delete(`${base}/:id`, ({ params }) => {
        calls.push(`DELETE ${String(params.id)}`);
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await expect(addToWishlist(7)).resolves.toBeUndefined();
    await expect(addToWishlist(7)).resolves.toBeUndefined();
    await expect(removeFromWishlist(7)).resolves.toBeUndefined();
    await expect(removeFromWishlist(7)).resolves.toBeUndefined();
    expect(calls).toEqual(['PUT 7', 'PUT 7', 'DELETE 7', 'DELETE 7']);
  });

  it.each([
    ['wishlist_book_not_found', 404],
    ['wishlist_limit_reached', 422],
  ])('turns %s (%i) into an ApiError with an Arabic message', async (code, status) => {
    server.use(http.put(`${base}/:id`, () => problem(status, code)));

    const error = await addToWishlist(7).catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe(code);
    expect((error as ApiError).status).toBe(status);
    expect(getApiErrorMessage(error as ApiError)).not.toBe('');
    expect(getApiErrorMessage(error as ApiError)).toMatch(/[؀-ۿ]/);
  });

  it('throws an ApiError for 401, 429 and 500 on every call', async () => {
    for (const status of [401, 429, 500]) {
      server.use(
        http.get(base, () => problem(status, 'x')),
        http.get(`${base}/ids`, () => problem(status, 'x')),
        http.put(`${base}/:id`, () => problem(status, 'x')),
        http.delete(`${base}/:id`, () => problem(status, 'x')),
      );

      for (const call of [
        () => getWishlist(),
        () => getWishlistIds(),
        () => addToWishlist(1),
        () => removeFromWishlist(1),
      ]) {
        const error = await call().catch((cause: unknown) => cause);
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(status);
      }
    }
  });
});
