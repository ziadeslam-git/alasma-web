import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/mocks/server';

import {
  BEST_SELLERS_CACHE_TAG,
  BEST_SELLERS_MAX,
  BEST_SELLERS_REVALIDATE_SECONDS,
  getBestSellers,
} from './get-best-sellers';

const ORIGIN = 'http://localhost:5198';
const book = {
  id: 1,
  slug: 'book-1',
  title: 'Book',
  coverImageUrl: null,
  authors: ['Author'],
  price: 100,
  finalPrice: 100,
  discountPercent: 0,
  stockStatus: 'InStock',
  isNew: false,
  isFeatured: false,
};

describe('getBestSellers', () => {
  it('exposes the hourly revalidate and the cache tag', () => {
    expect(BEST_SELLERS_REVALIDATE_SECONDS).toBe(3600);
    expect(BEST_SELLERS_CACHE_TAG).toBe('books:best-sellers');
    expect(BEST_SELLERS_MAX).toBe(24);
  });

  it('returns the ranked books and sends the limit', async () => {
    let query = '';
    server.use(
      http.get(`${ORIGIN}/api/v1/books/best-sellers`, ({ request }) => {
        query = new URL(request.url).search;
        return HttpResponse.json([book]);
      }),
    );

    const result = await getBestSellers(12, { origin: ORIGIN });

    expect(result).toEqual({ status: 'ok', items: [book] });
    expect(query).toBe('?limit=12');
  });

  it('answers empty for an empty list and error for a failure, without throwing', async () => {
    server.use(http.get(`${ORIGIN}/api/v1/books/best-sellers`, () => HttpResponse.json([])));
    await expect(getBestSellers(24, { origin: ORIGIN })).resolves.toEqual({
      status: 'empty',
      items: [],
    });

    server.use(
      http.get(`${ORIGIN}/api/v1/books/best-sellers`, () =>
        HttpResponse.json({ title: 'x' }, { status: 500 }),
      ),
    );
    await expect(getBestSellers(24, { origin: ORIGIN })).resolves.toEqual({
      status: 'error',
      items: [],
    });
  });
});
