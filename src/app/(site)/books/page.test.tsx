import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { server } from '@/mocks/server';
import { defaultApiOrigin } from '@/shared/lib/api';

import BooksLoading from './loading';
import BooksPage, { metadata } from './page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

describe('BooksPage (/books)', () => {
  it('exports the Arabic catalog metadata', () => {
    expect(metadata.title).toBe(messages.catalog.page.meta.title);
    expect(metadata.description).toBe(messages.catalog.page.meta.description);
  });

  it('parses searchParams, fetches catalog data and renders CatalogView', async () => {
    const origin = defaultApiOrigin;
    server.use(
      http.get(`${origin}/api/v1/books`, () =>
        HttpResponse.json({
          items: [
            {
              id: 1,
              slug: 'cairo-nights',
              title: messages.devCatalog.fixtures.plainTitle,
              coverImageUrl: null,
              authors: [messages.devCatalog.fixtures.plainAuthor],
              price: 130,
              finalPrice: 130,
              discountPercent: 0,
              stockStatus: 'InStock',
              isNew: true,
              isFeatured: false,
            },
          ],
          page: 1,
          pageSize: 12,
          totalCount: 1,
          totalPages: 1,
        }),
      ),
      http.get(`${origin}/api/v1/categories`, () =>
        HttpResponse.json([
          {
            id: 1,
            slug: 'novels',
            name: messages.devCatalogFilters.fixtures.fiction,
            imageUrl: null,
            children: [],
          },
        ]),
      ),
      http.get(`${origin}/api/v1/authors/options`, () =>
        HttpResponse.json([
          {
            id: 1,
            slug: 'sami-alhakim',
            name: messages.devCatalogFilters.fixtures.authorOne,
          },
        ]),
      ),
      http.get(`${origin}/api/v1/publishers`, () =>
        HttpResponse.json([
          {
            id: 1,
            slug: 'dar-al-asma',
            name: messages.devCatalogFilters.fixtures.publisherOne,
            logoUrl: null,
          },
        ]),
      ),
    );

    const ui = await BooksPage({
      searchParams: Promise.resolve({ category: 'novels' }),
    });
    const { container } = render(ui);

    expect(container.querySelector('main')).toBeNull();
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: messages.devCatalogFilters.fixtures.fiction,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: messages.devCatalog.fixtures.plainTitle }),
    ).toBeInTheDocument();
  });

  it('renders the skeleton loading state in BooksLoading', () => {
    const { container } = render(<BooksLoading />);

    expect(container.querySelector('main')).toBeNull();
    expect(
      screen.getByRole('heading', { level: 1, name: messages.catalog.page.heading }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status', { name: messages.catalog.loadingLabel })).toBeInTheDocument();
  });
});
