import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { axe } from '@/test/axe';

import type { BookCardItem, CatalogData } from '../types';
import { CatalogView } from './catalog-view';
import { makeParams, testFilterOptions, testText } from './filter-test-data';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

const text = messages.catalog.page;

const sampleBooks: readonly BookCardItem[] = [
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
  {
    id: 2,
    slug: 'tale-shadows',
    title: messages.devCatalog.fixtures.discountedTitle,
    coverImageUrl: null,
    authors: [messages.devCatalog.fixtures.discountedAuthor],
    price: 200,
    finalPrice: 160,
    discountPercent: 20,
    stockStatus: 'LowStock',
    isNew: false,
    isFeatured: true,
  },
];

function makeCatalogData(patch: Partial<CatalogData['books']> = {}): CatalogData {
  return {
    books: {
      status: 'ok',
      items: sampleBooks,
      page: 1,
      pageSize: 12,
      totalCount: 42,
      totalPages: 4,
      ...patch,
    },
    options: testFilterOptions,
  };
}

describe('CatalogView', () => {
  it('renders a single h1, result count, filter panel, sort select, book grid and pagination without a main landmark', async () => {
    const { container } = render(<CatalogView data={makeCatalogData()} params={makeParams()} />);

    expect(container.querySelector('main')).toBeNull();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1, name: text.heading })).toBeInTheDocument();
    expect(screen.getByTestId('catalog-result-count')).toHaveTextContent(
      text.resultsCount.replace('{count}', '42'),
    );
    expect(
      screen.getByRole('complementary', { name: messages.catalog.filters.panelLabel }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: messages.catalog.filters.sort.label }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: messages.devCatalog.fixtures.plainTitle }),
    ).toBeInTheDocument();

    const pagination = screen.getByRole('navigation', { name: text.pagination.label });
    expect(within(pagination).getByRole('link', { name: '1' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(pagination).getByRole('link', { name: '2' })).toHaveAttribute(
      'href',
      '/books?page=2',
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it('uses the matched category name as h1 and preserves active filters in pagination links', () => {
    const params = makeParams({
      category: 'mystery',
      inStock: true,
      sort: 'price_asc',
      page: 2,
    });
    render(<CatalogView data={makeCatalogData({ page: 2 })} params={params} />);

    expect(screen.getByRole('heading', { level: 1, name: testText.mystery })).toBeInTheDocument();
    const pagination = screen.getByRole('navigation', { name: text.pagination.label });
    expect(within(pagination).getByRole('link', { name: '3' })).toHaveAttribute(
      'href',
      '/books?category=mystery&inStock=true&sort=price_asc&page=3',
    );
    expect(within(pagination).getByRole('link', { name: '1' })).toHaveAttribute(
      'href',
      '/books?category=mystery&inStock=true&sort=price_asc',
    );
  });

  it('uses the search heading when q is active without a matching category', () => {
    const params = makeParams({ q: testText.poetry });
    render(<CatalogView data={makeCatalogData({ totalPages: 1 })} params={params} />);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: text.searchHeading.replace('{query}', testText.poetry),
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', { name: text.pagination.label }),
    ).not.toBeInTheDocument();
  });

  it('renders the filtered empty state with a reset link when active filters return zero books', async () => {
    const params = makeParams({ category: 'novels', inStock: true, sort: 'price_desc' });
    const { container } = render(
      <CatalogView
        data={makeCatalogData({ status: 'empty', items: [], totalCount: 0, totalPages: 0 })}
        params={params}
      />,
    );

    expect(
      screen.getByRole('heading', { level: 2, name: text.filteredEmptyTitle }),
    ).toBeInTheDocument();
    expect(screen.getByText(text.filteredEmptyDescription)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: text.resetFilters })).toHaveAttribute(
      'href',
      '/books?sort=price_desc',
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders the catalog empty state when no filters are active and the store has zero books', () => {
    render(
      <CatalogView
        data={makeCatalogData({ status: 'empty', items: [], totalCount: 0, totalPages: 0 })}
        params={makeParams()}
      />,
    );

    expect(
      screen.getByRole('heading', { level: 2, name: messages.catalog.emptyTitle }),
    ).toBeInTheDocument();
  });

  it('renders the invalid-filters state (HTTP 400) with a reset link and no result count', async () => {
    const params = makeParams({ minPrice: 100, maxPrice: 200 });
    const { container } = render(
      <CatalogView
        data={makeCatalogData({ status: 'invalid', items: [], totalCount: 0, totalPages: 0 })}
        params={params}
      />,
    );

    expect(screen.queryByTestId('catalog-result-count')).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: text.invalidFiltersTitle }),
    ).toBeInTheDocument();
    expect(screen.getByText(text.invalidFiltersDescription)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: text.resetFilters })).toHaveAttribute('href', '/books');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders the server error state (HTTP 500 / network) with a retry link to the current URL', async () => {
    const params = makeParams({ category: 'novels', page: 2 });
    const { container } = render(
      <CatalogView
        data={makeCatalogData({ status: 'error', items: [], totalCount: 0, totalPages: 0 })}
        params={params}
      />,
    );

    expect(screen.queryByTestId('catalog-result-count')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: text.errorTitle })).toBeInTheDocument();
    expect(screen.getByText(text.errorDescription)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: text.retry })).toHaveAttribute(
      'href',
      '/books?category=novels&page=2',
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders the skeleton grid when isLoading is true', () => {
    render(<CatalogView data={makeCatalogData()} isLoading params={makeParams()} />);

    expect(screen.queryByTestId('catalog-result-count')).not.toBeInTheDocument();
    expect(screen.getByRole('status', { name: messages.catalog.loadingLabel })).toBeInTheDocument();
  });
});
