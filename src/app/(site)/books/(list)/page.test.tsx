import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { server } from '@/mocks/server';
import { defaultApiOrigin } from '@/shared/lib/api';

import BooksLoading from './loading';
import BooksPage, { generateMetadata } from './page';

vi.mock('@/modules/cart', () => ({
  AddToCartButton: ({ title }: { title: string }) => <button type="button" aria-label={title} />,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

describe('BooksPage (/books)', () => {
  it('computes the Arabic catalog metadata with canonical and robots rules', async () => {
    const meta = await generateMetadata();
    expect(meta.title).toBe(messages.catalog.page.meta.title);
    expect(meta.description).toBe(messages.catalog.page.meta.description);
    expect(meta.robots).toEqual({ index: true, follow: true });

    const filteredMeta = await generateMetadata({
      searchParams: Promise.resolve({ category: 'novels' }),
    });
    expect(filteredMeta.robots).toEqual({ index: false, follow: true });
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
    // Task 79 (B1): the skeleton is streamed into the HTML next to the real page, so its title is plain text, not a second h1
    expect(container.querySelectorAll('h1')).toHaveLength(0);
    expect(screen.getByText(messages.catalog.page.heading)).toBeInTheDocument();
    expect(screen.getByRole('status', { name: messages.catalog.loadingLabel })).toBeInTheDocument();
  });

  // Task 76: the authors and events tabs are hidden, so the tabs row (a lone "books" tab) is left out
  it('shows no search tabs row while the extra tabs are not live', async () => {
    const ui = await BooksPage({ searchParams: Promise.resolve({ q: 'book' }) });
    render(ui);
    expect(screen.queryByRole('navigation', { name: messages.search.title })).toBeNull();
  });
});
