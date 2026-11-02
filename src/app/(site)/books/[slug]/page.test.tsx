import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { Suspense } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { server } from '@/mocks/server';
import type { BookDetails } from '@/modules/catalog';
import { defaultApiOrigin } from '@/shared/lib/api';

import BookPage, { generateMetadata, generateStaticParams, revalidate } from './page';

const NOT_FOUND_SENTINEL = 'NEXT_NOT_FOUND';

const notFoundMock = vi.fn(() => {
  throw new Error(NOT_FOUND_SENTINEL);
});

vi.mock('next/navigation', () => ({
  notFound: () => notFoundMock(),
}));

vi.mock('./related-books', () => ({
  RelatedBooks: ({ slug }: { slug: string }) => <span data-testid="related-books">{slug}</span>,
}));

const ORIGIN = defaultApiOrigin;

const sampleBookDetails: BookDetails = {
  id: 42,
  title: 'ظلال الحكاية',
  slug: 'shadows-of-the-tale',
  description: 'وصف الكتاب الكامل بالتفصيل.',
  price: 150,
  finalPrice: 120,
  discountPercent: 20,
  pageCount: 320,
  publishYear: 2025,
  coverType: 'Hardcover',
  language: 'Arabic',
  isbn: '978-1-23456-789-0',
  coverImageUrl: null,
  images: [],
  authors: [
    {
      name: 'سامي الحكيم',
      role: 'Author',
      pageSlug: 'sami-al-hakim',
      shortBio: 'روائي مصري.',
      displayOrder: 1,
    },
  ],
  publisher: {
    name: 'دار الأسمى',
    slug: 'al-asma',
    shortDescription: null,
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

describe('BookPage (/books/[slug])', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('exports revalidate = 600', () => {
    expect(revalidate).toBe(600);
  });

  it('calls notFound() without making any API call when the slug is invalid', async () => {
    const apiCalled = vi.fn();
    server.use(
      http.get(`${ORIGIN}/api/v1/books/:slug`, () => {
        apiCalled();
        return HttpResponse.json({});
      }),
    );

    await expect(
      BookPage({ params: Promise.resolve({ slug: '%invalid-percent' }) }),
    ).rejects.toThrow(NOT_FOUND_SENTINEL);

    expect(notFoundMock).toHaveBeenCalled();
    expect(apiCalled).not.toHaveBeenCalled();
  });

  it('calls notFound() when params rejects with URIError without calling the API', async () => {
    const apiCalled = vi.fn();
    server.use(
      http.get(`${ORIGIN}/api/v1/books/:slug`, () => {
        apiCalled();
        return HttpResponse.json({});
      }),
    );

    await expect(
      BookPage({ params: Promise.reject(new URIError('URI malformed')) }),
    ).rejects.toThrow(NOT_FOUND_SENTINEL);

    expect(notFoundMock).toHaveBeenCalled();
    expect(apiCalled).not.toHaveBeenCalled();
  });

  it('calls notFound() when the slug exceeds the 350-character limit without calling the API', async () => {
    const apiCalled = vi.fn();
    server.use(
      http.get(`${ORIGIN}/api/v1/books/:slug`, () => {
        apiCalled();
        return HttpResponse.json({});
      }),
    );

    const overlyLongSlug = 'a'.repeat(351);
    await expect(BookPage({ params: Promise.resolve({ slug: overlyLongSlug }) })).rejects.toThrow(
      NOT_FOUND_SENTINEL,
    );

    expect(notFoundMock).toHaveBeenCalled();
    expect(apiCalled).not.toHaveBeenCalled();
  });

  it('calls notFound() when the API returns 404', async () => {
    server.use(
      http.get(`${ORIGIN}/api/v1/books/:slug`, () =>
        HttpResponse.json({ status: 404, title: 'Not Found' }, { status: 404 }),
      ),
    );

    await expect(BookPage({ params: Promise.resolve({ slug: 'unknown-book' }) })).rejects.toThrow(
      NOT_FOUND_SENTINEL,
    );

    expect(notFoundMock).toHaveBeenCalled();
  });

  it('calls notFound() when the API returns 400 Bad Request', async () => {
    server.use(
      http.get(`${ORIGIN}/api/v1/books/:slug`, () =>
        HttpResponse.json({ status: 400, title: 'Bad Request' }, { status: 400 }),
      ),
    );

    await expect(
      BookPage({ params: Promise.resolve({ slug: 'bad-request-book' }) }),
    ).rejects.toThrow(NOT_FOUND_SENTINEL);

    expect(notFoundMock).toHaveBeenCalled();
  });

  it('throws when the API returns 500 so Next error handling takes over', async () => {
    server.use(
      http.get(`${ORIGIN}/api/v1/books/:slug`, () =>
        HttpResponse.json({ status: 500, title: 'Server Error' }, { status: 500 }),
      ),
    );

    await expect(BookPage({ params: Promise.resolve({ slug: 'failing-book' }) })).rejects.toThrow();
  });

  it('renders book details and related books when API calls succeed', async () => {
    server.use(
      http.get(`${ORIGIN}/api/v1/books/:slug`, ({ params }) => {
        if (params.slug === 'shadows-of-the-tale') {
          return HttpResponse.json(sampleBookDetails);
        }
        return new HttpResponse(null, { status: 404 });
      }),
    );

    const pageElement = await BookPage({
      params: Promise.resolve({ slug: 'shadows-of-the-tale' }),
    });

    render(pageElement);

    expect(pageElement.props.children.type).toBe(Suspense);
    expect(screen.getByRole('heading', { level: 1, name: 'ظلال الحكاية' })).toBeInTheDocument();
    expect(screen.getAllByText('سامي الحكيم').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId('related-books')).toHaveTextContent('shadows-of-the-tale');
  });

  describe('generateMetadata', () => {
    it('calls notFound() for invalid slugs', async () => {
      await expect(
        generateMetadata({
          params: Promise.resolve({ slug: '%invalid' }),
        }),
      ).rejects.toThrow(NOT_FOUND_SENTINEL);
    });

    it('calls notFound() when params rejects', async () => {
      await expect(
        generateMetadata({
          params: Promise.reject(new URIError('URI malformed')),
        }),
      ).rejects.toThrow(NOT_FOUND_SENTINEL);
    });

    it('returns title and trimmed description for valid slugs', async () => {
      server.use(
        http.get(`${ORIGIN}/api/v1/books/:slug`, () => HttpResponse.json(sampleBookDetails)),
      );

      const meta = await generateMetadata({
        params: Promise.resolve({ slug: 'shadows-of-the-tale' }),
      });

      expect(meta.title).toBe('ظلال الحكاية');
      expect(meta.description).toBe('وصف الكتاب الكامل بالتفصيل.');
    });
  });

  describe('generateStaticParams', () => {
    it('generates book paths on demand', async () => {
      await expect(generateStaticParams()).resolves.toEqual([]);
    });
  });
});
