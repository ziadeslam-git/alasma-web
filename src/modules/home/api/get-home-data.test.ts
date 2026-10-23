import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { BookCardItem, CategoryNode } from '@/modules/catalog';
import { server } from '@/mocks/server';

import { getHomeData, HOME_CACHE_TAGS, HOME_REVALIDATE_SECONDS } from './get-home-data';

const ORIGIN = 'http://localhost:5198';

const sampleBook: BookCardItem = {
  id: 1,
  slug: 'cairo-nights',
  title: 'ليالي القاهرة',
  coverImageUrl: null,
  authors: ['عمر الشريف'],
  price: 130,
  finalPrice: 130,
  discountPercent: 0,
  stockStatus: 'InStock',
  isNew: true,
  isFeatured: true,
};

const sampleCategory: CategoryNode = {
  id: 10,
  slug: 'novels',
  name: 'الروايات',
  imageUrl: null,
  children: [],
};

describe('getHomeData', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exposes the 300s revalidate constant and cache tags', () => {
    expect(HOME_REVALIDATE_SECONDS).toBe(300);
    expect(HOME_CACHE_TAGS).toEqual({
      categories: 'categories',
      featured: 'books:featured',
      newArrivals: 'books:new-arrivals',
    });
  });

  it('returns status ok for all three sections when all three endpoints succeed with items', async () => {
    server.use(
      http.get(`${ORIGIN}/api/v1/books/featured`, () => HttpResponse.json([sampleBook])),
      http.get(`${ORIGIN}/api/v1/books/new-arrivals`, () => HttpResponse.json([sampleBook])),
      http.get(`${ORIGIN}/api/v1/categories`, () => HttpResponse.json([sampleCategory])),
    );

    const data = await getHomeData({ origin: ORIGIN });

    expect(data).toEqual({
      featured: { items: [sampleBook], status: 'ok' },
      newArrivals: { items: [sampleBook], status: 'ok' },
      categories: { items: [sampleCategory], status: 'ok' },
    });
  });

  it('returns status empty when an endpoint returns an empty array', async () => {
    server.use(
      http.get(`${ORIGIN}/api/v1/books/featured`, () => HttpResponse.json([])),
      http.get(`${ORIGIN}/api/v1/books/new-arrivals`, () => HttpResponse.json([])),
      http.get(`${ORIGIN}/api/v1/categories`, () => HttpResponse.json([])),
    );

    const data = await getHomeData({ origin: ORIGIN });

    expect(data).toEqual({
      featured: { items: [], status: 'empty' },
      newArrivals: { items: [], status: 'empty' },
      categories: { items: [], status: 'empty' },
    });
  });

  it('isolates a single failing section and keeps the other two sections ok', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    server.use(
      http.get(`${ORIGIN}/api/v1/books/featured`, () =>
        HttpResponse.json({ title: 'Server Error' }, { status: 500 }),
      ),
      http.get(`${ORIGIN}/api/v1/books/new-arrivals`, () => HttpResponse.json([sampleBook])),
      http.get(`${ORIGIN}/api/v1/categories`, () => HttpResponse.json([sampleCategory])),
    );

    const data = await getHomeData({ origin: ORIGIN });

    expect(data.featured).toEqual({ items: [], status: 'error' });
    expect(data.newArrivals).toEqual({ items: [sampleBook], status: 'ok' });
    expect(data.categories).toEqual({ items: [sampleCategory], status: 'ok' });
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith('[home] Failed to fetch featured (500)');
  });

  it('returns status error for all three sections when all endpoints fail without throwing', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    server.use(
      http.get(`${ORIGIN}/api/v1/books/featured`, () => HttpResponse.error()),
      http.get(`${ORIGIN}/api/v1/books/new-arrivals`, () =>
        HttpResponse.json({ title: 'Service Unavailable' }, { status: 503 }),
      ),
      http.get(`${ORIGIN}/api/v1/categories`, () =>
        HttpResponse.json({ title: 'Bad Gateway' }, { status: 502 }),
      ),
    );

    const data = await getHomeData({ origin: ORIGIN });

    expect(data).toEqual({
      featured: { items: [], status: 'error' },
      newArrivals: { items: [], status: 'error' },
      categories: { items: [], status: 'error' },
    });
    expect(errorSpy).toHaveBeenCalledTimes(3);
  });
});
