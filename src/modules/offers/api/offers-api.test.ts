import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/mocks/server';

import { getBundles, getDiscountedBooks } from './offers-api';

const ORIGIN = 'http://localhost:5198';
const bundle = {
  slug: 'bundle-1',
  title: 'Bundle',
  imageUrl: null,
  description: null,
  startsAt: '2026-11-01T00:00:00Z',
  endsAt: null,
  booksTotal: 410,
  price: 330,
  saving: 80,
  savingPercent: 19.5,
  stockStatus: 'InStock',
  books: [],
};
const page = (items: unknown[]) => ({ items, page: 1, pageSize: 20, totalCount: items.length });

describe('offers API', () => {
  it('reads the bundles with the API price and saving', async () => {
    let query = '';
    server.use(
      http.get(`${ORIGIN}/api/v1/bundles`, ({ request }) => {
        query = new URL(request.url).search;
        return HttpResponse.json(page([bundle]));
      }),
    );

    const result = await getBundles({ origin: ORIGIN });

    expect(result).toEqual({ status: 'ok', items: [bundle] });
    expect(query).toBe('?page=1&pageSize=20');
  });

  it('answers empty or error for bundles without throwing', async () => {
    server.use(http.get(`${ORIGIN}/api/v1/bundles`, () => HttpResponse.json(page([]))));
    await expect(getBundles({ origin: ORIGIN })).resolves.toEqual({ status: 'empty', items: [] });

    server.use(
      http.get(`${ORIGIN}/api/v1/bundles`, () =>
        HttpResponse.json({ title: 'x' }, { status: 500 }),
      ),
    );
    await expect(getBundles({ origin: ORIGIN })).resolves.toEqual({ status: 'error', items: [] });
  });

  it('reads the newest discounted books and handles empty and error', async () => {
    let query = '';
    server.use(
      http.get(`${ORIGIN}/api/v1/books`, ({ request }) => {
        query = new URL(request.url).search;
        return HttpResponse.json(page([]));
      }),
    );
    await expect(getDiscountedBooks({ origin: ORIGIN })).resolves.toEqual({
      status: 'empty',
      items: [],
    });
    expect(query).toContain('hasDiscount=true');
    expect(query).toContain('sort=newest');
    expect(query).toContain('pageSize=8');

    server.use(http.get(`${ORIGIN}/api/v1/books`, () => HttpResponse.error()));
    await expect(getDiscountedBooks({ origin: ORIGIN })).resolves.toEqual({
      status: 'error',
      items: [],
    });
  });
});
