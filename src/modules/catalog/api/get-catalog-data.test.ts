import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { server } from '@/mocks/server';

import type { AuthorOption, BookCardItem, CategoryNode, PublisherOption } from '../types';
import { emptyCatalogParams, parseCatalogParams } from '../url/catalog-params';
import {
  CATALOG_BOOKS_REVALIDATE_SECONDS,
  CATALOG_CACHE_TAGS,
  CATALOG_OPTIONS_REVALIDATE_SECONDS,
  DEFAULT_CATALOG_PAGE_SIZE,
  getCatalogData,
} from './get-catalog-data';

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
  isFeatured: false,
};

const sampleCategory: CategoryNode = {
  id: 10,
  slug: 'novels',
  name: 'الروايات',
  imageUrl: null,
  children: [],
};

const sampleAuthor: AuthorOption = {
  id: 20,
  slug: 'omar-alsharif',
  name: 'عمر الشريف',
};

const samplePublisher: PublisherOption = {
  id: 30,
  slug: 'dar-al-asma',
  name: 'دار الأسمى',
  logoUrl: null,
};

describe('getCatalogData', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exposes the revalidate constants, default page size and cache tags', () => {
    expect(DEFAULT_CATALOG_PAGE_SIZE).toBe(12);
    expect(CATALOG_BOOKS_REVALIDATE_SECONDS).toBe(60);
    expect(CATALOG_OPTIONS_REVALIDATE_SECONDS).toBe(300);
    expect(CATALOG_CACHE_TAGS).toEqual({
      books: 'books',
      categories: 'categories',
      authors: 'authors:options',
      publishers: 'publishers',
    });
  });

  it('fetches books with query params and all three filter option lists in parallel', async () => {
    let capturedSearch = '';
    server.use(
      http.get(`${ORIGIN}/api/v1/books`, ({ request }) => {
        capturedSearch = new URL(request.url).search;
        return HttpResponse.json({
          items: [sampleBook],
          page: 2,
          pageSize: 12,
          totalCount: 25,
          totalPages: 3,
          hasNextPage: true,
          hasPreviousPage: true,
        });
      }),
      http.get(`${ORIGIN}/api/v1/categories`, () => HttpResponse.json([sampleCategory])),
      http.get(`${ORIGIN}/api/v1/authors/options`, () => HttpResponse.json([sampleAuthor])),
      http.get(`${ORIGIN}/api/v1/publishers`, () => HttpResponse.json([samplePublisher])),
    );

    const params = parseCatalogParams({
      category: 'novels',
      author: 'omar-alsharif',
      inStock: 'true',
      sort: 'price_asc',
      page: '2',
    });
    const data = await getCatalogData(params, { origin: ORIGIN });

    const sentQuery = new URLSearchParams(capturedSearch);
    expect(sentQuery.get('category')).toBe('novels');
    expect(sentQuery.get('author')).toBe('omar-alsharif');
    expect(sentQuery.get('inStock')).toBe('true');
    expect(sentQuery.get('sort')).toBe('price_asc');
    expect(sentQuery.get('page')).toBe('2');

    expect(data).toEqual({
      books: {
        status: 'ok',
        items: [sampleBook],
        page: 2,
        pageSize: 12,
        totalCount: 25,
        totalPages: 3,
      },
      options: {
        categories: [sampleCategory],
        authors: [sampleAuthor],
        publishers: [samplePublisher],
      },
    });
  });

  it('returns status empty when books endpoint returns zero items and computes totalPages when omitted', async () => {
    server.use(
      http.get(`${ORIGIN}/api/v1/books`, () =>
        HttpResponse.json({
          items: [],
          page: 1,
          pageSize: 12,
          totalCount: 0,
        }),
      ),
      http.get(`${ORIGIN}/api/v1/categories`, () => HttpResponse.json([sampleCategory])),
      http.get(`${ORIGIN}/api/v1/authors/options`, () => HttpResponse.json([sampleAuthor])),
      http.get(`${ORIGIN}/api/v1/publishers`, () => HttpResponse.json([samplePublisher])),
    );

    const data = await getCatalogData(emptyCatalogParams, { origin: ORIGIN });

    expect(data.books).toEqual({
      status: 'empty',
      items: [],
      page: 1,
      pageSize: 12,
      totalCount: 0,
      totalPages: 0,
    });
  });

  it('maps HTTP 400 from GET /api/v1/books to status invalid while keeping filter options', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    server.use(
      http.get(`${ORIGIN}/api/v1/books`, () =>
        HttpResponse.json(
          { title: 'One or more validation errors occurred.', status: 400 },
          { status: 400 },
        ),
      ),
      http.get(`${ORIGIN}/api/v1/categories`, () => HttpResponse.json([sampleCategory])),
      http.get(`${ORIGIN}/api/v1/authors/options`, () => HttpResponse.json([sampleAuthor])),
      http.get(`${ORIGIN}/api/v1/publishers`, () => HttpResponse.json([samplePublisher])),
    );

    const data = await getCatalogData(emptyCatalogParams, { origin: ORIGIN });

    expect(data.books).toEqual({
      status: 'invalid',
      items: [],
      page: 1,
      pageSize: 12,
      totalCount: 0,
      totalPages: 0,
    });
    expect(data.options.categories).toEqual([sampleCategory]);
    expect(data.options.authors).toEqual([sampleAuthor]);
    expect(data.options.publishers).toEqual([samplePublisher]);
    expect(errorSpy).toHaveBeenCalledWith('[catalog] Invalid catalog filter parameters (400)');
  });

  it('maps HTTP 500 or network failure on GET /api/v1/books to status error without throwing', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    server.use(
      http.get(`${ORIGIN}/api/v1/books`, () =>
        HttpResponse.json({ title: 'Server Error', status: 500 }, { status: 500 }),
      ),
      http.get(`${ORIGIN}/api/v1/categories`, () => HttpResponse.json([sampleCategory])),
      http.get(`${ORIGIN}/api/v1/authors/options`, () => HttpResponse.json([sampleAuthor])),
      http.get(`${ORIGIN}/api/v1/publishers`, () => HttpResponse.json([samplePublisher])),
    );

    const data = await getCatalogData(emptyCatalogParams, { origin: ORIGIN });

    expect(data.books.status).toBe('error');
    expect(data.books.items).toEqual([]);
    expect(errorSpy).toHaveBeenCalledWith('[catalog] Failed to fetch books (500)');
  });

  it('degrades failing filter option endpoints to empty arrays while keeping books ok', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    server.use(
      http.get(`${ORIGIN}/api/v1/books`, () =>
        HttpResponse.json({
          items: [sampleBook],
          page: 1,
          pageSize: 12,
          totalCount: 14,
        }),
      ),
      http.get(`${ORIGIN}/api/v1/categories`, () => HttpResponse.error()),
      http.get(`${ORIGIN}/api/v1/authors/options`, () =>
        HttpResponse.json({ title: 'Bad Gateway' }, { status: 502 }),
      ),
      http.get(`${ORIGIN}/api/v1/publishers`, () => HttpResponse.json([samplePublisher])),
    );

    const data = await getCatalogData(emptyCatalogParams, { origin: ORIGIN });

    expect(data.books).toEqual({
      status: 'ok',
      items: [sampleBook],
      page: 1,
      pageSize: 12,
      totalCount: 14,
      totalPages: 2,
    });
    expect(data.options).toEqual({
      categories: [],
      authors: [],
      publishers: [samplePublisher],
    });
    expect(errorSpy).toHaveBeenCalledTimes(2);
  });
});
