import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { server } from '@/mocks/server';
import type { BookCardItem, BookDetails } from '@/modules/catalog';

import {
  BOOK_DETAILS_CACHE_TAG,
  BOOK_DETAILS_REVALIDATE_SECONDS,
  getBook,
  getRelatedBooks,
} from './get-book';

const ORIGIN = 'http://localhost:5198';

const sampleBookDetails: BookDetails = {
  id: 42,
  title: 'ظلال الحكاية',
  slug: 'shadows-of-the-tale',
  description: 'وصف الكتاب التجريبي الكامل.',
  price: 150,
  finalPrice: 120,
  discountPercent: 20,
  pageCount: 320,
  publishYear: 2025,
  coverType: 'Hardcover',
  language: 'Arabic',
  isbn: '978-1-23456-789-0',
  coverImageUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
  images: [],
  authors: [
    {
      name: 'سامي الحكيم',
      role: 'Author',
      pageSlug: 'sami-al-hakim',
      shortBio: 'روائي مصري معاصر.',
      displayOrder: 1,
    },
  ],
  publisher: {
    name: 'دار الأسمى',
    slug: 'al-asma',
    shortDescription: 'دار نشر وتوزيع رائدة.',
  },
  categories: [
    {
      id: 1,
      name: 'الروايات',
      slug: 'novels',
      isPrimary: true,
    },
  ],
  stockStatus: 'InStock',
  isNew: false,
  isFeatured: true,
};

const sampleRelatedBook: BookCardItem = {
  id: 43,
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

describe('getBook and getRelatedBooks', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exposes the 600s revalidate constant and single books cache tag', () => {
    expect(BOOK_DETAILS_REVALIDATE_SECONDS).toBe(600);
    expect(BOOK_DETAILS_CACHE_TAG).toBe('books');
  });

  describe('getBook', () => {
    it('returns ok with book details when API returns 200', async () => {
      server.use(
        http.get(`${ORIGIN}/api/v1/books/:slug`, ({ params }) => {
          if (params.slug === 'shadows-of-the-tale') {
            return HttpResponse.json(sampleBookDetails);
          }
          return new HttpResponse(null, { status: 404 });
        }),
      );

      const result = await getBook('shadows-of-the-tale', { origin: ORIGIN });
      expect(result).toEqual({ kind: 'ok', book: sampleBookDetails });
    });

    it('returns notFound when API returns 404', async () => {
      server.use(
        http.get(`${ORIGIN}/api/v1/books/:slug`, () =>
          HttpResponse.json(
            { code: 'catalog_book_not_found', title: 'Not Found', status: 404 },
            { status: 404 },
          ),
        ),
      );

      const result = await getBook('unknown-book', { origin: ORIGIN });
      expect(result).toEqual({ kind: 'notFound' });
    });

    it('returns notFound when API returns 400 Bad Request', async () => {
      server.use(
        http.get(`${ORIGIN}/api/v1/books/:slug`, () =>
          HttpResponse.json(
            { title: 'Validation Error', status: 400, errors: { slug: ['Invalid slug'] } },
            { status: 400 },
          ),
        ),
      );

      const result = await getBook('invalid-slug', { origin: ORIGIN });
      expect(result).toEqual({ kind: 'notFound' });
    });

    it('throws ApiError when API returns 500 Server Error', async () => {
      server.use(
        http.get(`${ORIGIN}/api/v1/books/:slug`, () =>
          HttpResponse.json({ title: 'Internal Server Error', status: 500 }, { status: 500 }),
        ),
      );

      await expect(getBook('failing-book', { origin: ORIGIN })).rejects.toThrow();
    });

    it('throws error when a network failure occurs', async () => {
      server.use(http.get(`${ORIGIN}/api/v1/books/:slug`, () => HttpResponse.error()));

      await expect(getBook('network-fail-book', { origin: ORIGIN })).rejects.toThrow();
    });
  });

  describe('getRelatedBooks', () => {
    it('returns related books list when API returns 200', async () => {
      server.use(
        http.get(`${ORIGIN}/api/v1/books/:slug/related`, () =>
          HttpResponse.json([sampleRelatedBook]),
        ),
      );

      const items = await getRelatedBooks('shadows-of-the-tale', { origin: ORIGIN });
      expect(items).toEqual([sampleRelatedBook]);
    });

    it('returns an empty array when API returns empty list', async () => {
      server.use(http.get(`${ORIGIN}/api/v1/books/:slug/related`, () => HttpResponse.json([])));

      const items = await getRelatedBooks('isolated-book', { origin: ORIGIN });
      expect(items).toEqual([]);
    });

    it('returns an empty array silently when endpoint fails with 500 or 404', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      server.use(
        http.get(`${ORIGIN}/api/v1/books/:slug/related`, () =>
          HttpResponse.json({ status: 500 }, { status: 500 }),
        ),
      );

      const items = await getRelatedBooks('error-related', { origin: ORIGIN });
      expect(items).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[book] Failed to fetch related books'),
      );
    });

    it('returns an empty array silently on network failure', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      server.use(http.get(`${ORIGIN}/api/v1/books/:slug/related`, () => HttpResponse.error()));

      const items = await getRelatedBooks('net-fail-related', { origin: ORIGIN });
      expect(items).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[book] Failed to fetch related books'),
      );
    });
  });
});
