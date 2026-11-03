import { render, screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { server } from '@/mocks/server';
import { formatDiscountBadge, formatMoney, formatNumber } from '@/shared/lib/format';
import { axe } from '@/test/axe';

import { ORIGIN, sample, textProblems } from '@/test/contract/contract-helpers';

import { getBook } from '@/modules/catalog/api/get-book';
import { getCatalogData } from '@/modules/catalog/api/get-catalog-data';
import { getCategoryTree } from '@/modules/catalog/api/get-category-tree';
import { BookCard } from '@/modules/catalog/components/book-card';
import { BookDetailsView } from '@/modules/catalog/components/book-details-view';
import { CatalogView } from '@/modules/catalog/components/catalog-view';
import { CategoriesView } from '@/modules/catalog/components/categories-view';
import type { BookCardItem, BookDetails, CategoryNode } from '@/modules/catalog/types';
import { emptyCatalogParams } from '@/modules/catalog/url/catalog-params';
import { getHomeData } from '@/modules/home/api/get-home-data';
import { HomeView } from '@/modules/home/components/home-view';

vi.mock('@/modules/cart', () => ({
  AddToCartButton: ({ title }: { title: string }) => <button type="button" aria-label={title} />,
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));

const text = messages.catalog;
const detail = messages.catalog.detail;

const stockLabel: Record<BookCardItem['stockStatus'], string | undefined> = {
  InStock: undefined,
  LowStock: text.stock.lowStock,
  OutOfStock: text.stock.outOfStock,
};

function expectBookCard(book: BookCardItem) {
  const { container } = render(<BookCard book={book} />);
  const card = within(container.querySelector('article') as HTMLElement);

  expect(card.getByRole('link', { name: book.title })).toHaveAttribute(
    'href',
    `/books/${encodeURIComponent(book.slug)}`,
  );
  expect(card.getByText(formatMoney(book.finalPrice))).toBeInTheDocument();
  const hasDiscount = book.discountPercent > 0 && book.finalPrice < book.price;
  if (hasDiscount) {
    expect(card.getByText(formatDiscountBadge(book.discountPercent))).toBeInTheDocument();
    expect(container.querySelector('s')).toHaveTextContent(formatNumber(book.price));
  } else {
    expect(container.querySelector('s')).toBeNull();
    expect(card.queryByText(/خصم/)).toBeNull();
  }
  for (const [status, label] of Object.entries(stockLabel)) {
    if (!label) continue;
    const isShown = card.queryByText(label, { selector: 'span' }) !== null;
    expect(isShown).toBe(status === book.stockStatus);
  }
  expect(textProblems(container)).toEqual([]);
  return container;
}

describe('book cards from the list samples', () => {
  for (const file of [
    'books-featured.json',
    'books-new-arrivals.json',
    'books-list-pageSize3.json',
  ]) {
    it(`renders every card of ${file}`, async () => {
      const raw = sample<BookCardItem[] | { items: BookCardItem[] }>(file);
      const items = Array.isArray(raw) ? raw : raw.items;
      expect(items.length).toBeGreaterThan(0);
      for (const book of items) {
        const container = expectBookCard(book);
        expect(await axe(container)).toHaveNoViolations();
        container.remove();
      }
    });
  }
});

describe('getBook and BookDetailsView with the book samples', () => {
  const cases = [
    { file: 'book-discounted-demo-book-002.json', stock: undefined, hasDiscount: true },
    { file: 'book-low-stock-demo-book-014.json', stock: detail.stock.lowStock, hasDiscount: false },
    {
      file: 'book-out-of-stock-demo-book-010.json',
      stock: detail.stock.outOfStock,
      hasDiscount: false,
    },
  ];

  for (const { file, stock, hasDiscount } of cases) {
    it(`renders ${file}`, async () => {
      const body = sample<BookDetails>(file);
      server.use(http.get(`${ORIGIN}/api/v1/books/:slug`, () => HttpResponse.json(body)));
      server.use(
        http.get(`${ORIGIN}/api/v1/books/:slug/related`, () =>
          HttpResponse.json(sample('books-featured.json')),
        ),
      );

      const result = await getBook(body.slug, { origin: ORIGIN });
      expect(result.kind).toBe('ok');
      if (result.kind !== 'ok') return;

      const { container } = render(
        <BookDetailsView
          book={result.book}
          relatedBooks={sample<BookCardItem[]>('books-featured.json').slice(0, 2)}
        />,
      );

      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
      expect(screen.getByRole('heading', { level: 1, name: body.title })).toBeVisible();
      // The soon-gated format selector repeats the price, so the final price is read from its own element.
      expect(container.querySelector('[class*="finalPrice"]')).toHaveTextContent(
        formatMoney(body.finalPrice),
      );
      if (hasDiscount) {
        expect(screen.getByText(formatMoney(body.price), { selector: 's' })).toBeInTheDocument();
        expect(
          screen.getByText(formatDiscountBadge(body.discountPercent, detail.savePercent)),
        ).toBeInTheDocument();
      } else {
        // Related cards below may be discounted, so only the book's own price block is checked.
        expect(container.querySelector('[class*="priceBlock"] s')).toBeNull();
      }
      for (const label of [detail.stock.inStock, detail.stock.lowStock, detail.stock.outOfStock]) {
        const expected = stock ?? detail.stock.inStock;
        expect(screen.queryByText(label) !== null).toBe(label === expected);
      }
      expect(screen.getByText(body.isbn as string)).toHaveAttribute('dir', 'ltr');
      expect(screen.getByText(body.description as string)).toBeVisible();
      for (const author of body.authors) {
        expect(screen.getAllByText(new RegExp(author.name)).length).toBeGreaterThan(0);
      }
      expect(textProblems(container)).toEqual([]);
      expect(await axe(container)).toHaveNoViolations();
    });
  }

  it('treats a 404 as not found', async () => {
    server.use(
      http.get(`${ORIGIN}/api/v1/books/:slug`, () =>
        HttpResponse.json(sample('author-non-house-demo-hala-badr-404.json'), { status: 404 }),
      ),
    );
    expect(await getBook('missing', { origin: ORIGIN })).toEqual({ kind: 'notFound' });
  });
});

describe('getHomeData and HomeView', () => {
  it('renders the featured, new-arrivals and category samples', async () => {
    server.use(
      http.get(`${ORIGIN}/api/v1/books/featured`, () =>
        HttpResponse.json(sample('books-featured.json')),
      ),
      http.get(`${ORIGIN}/api/v1/books/new-arrivals`, () =>
        HttpResponse.json(sample('books-new-arrivals.json')),
      ),
      http.get(`${ORIGIN}/api/v1/categories`, () =>
        HttpResponse.json(sample('categories-tree.json')),
      ),
    );
    const data = await getHomeData({ origin: ORIGIN });
    expect(data.featured.status).toBe('ok');
    expect(data.newArrivals.status).toBe('ok');
    expect(data.categories.status).toBe('ok');

    const { container } = render(<HomeView data={data} />);
    const featured = sample<BookCardItem[]>('books-featured.json');
    for (const book of featured) {
      expect(screen.getAllByRole('link', { name: book.title }).length).toBeGreaterThan(0);
    }
    for (const category of sample<CategoryNode[]>('categories-tree.json')) {
      expect(screen.getAllByText(category.name).length).toBeGreaterThan(0);
    }
    expect(textProblems(container)).toEqual([]);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('getCatalogData and CatalogView', () => {
  it('renders the pageSize=3 list with the category and publisher samples', async () => {
    const list = sample<{ items: BookCardItem[]; totalCount: number; totalPages: number }>(
      'books-list-pageSize3.json',
    );
    server.use(
      http.get(`${ORIGIN}/api/v1/books`, () => HttpResponse.json(list)),
      http.get(`${ORIGIN}/api/v1/categories`, () =>
        HttpResponse.json(sample('categories-tree.json')),
      ),
      // No sample exists for GET /authors/options.
      http.get(`${ORIGIN}/api/v1/authors/options`, () => HttpResponse.json([])),
      http.get(`${ORIGIN}/api/v1/publishers`, () => HttpResponse.json(sample('publishers.json'))),
    );
    const data = await getCatalogData(emptyCatalogParams, { origin: ORIGIN, pageSize: 3 });
    expect(data.books).toMatchObject({ status: 'ok', pageSize: 3, totalCount: 30, totalPages: 10 });
    expect(data.options.publishers).toHaveLength(3);

    const { container } = render(<CatalogView data={data} params={emptyCatalogParams} />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    for (const book of list.items) {
      expect(screen.getByRole('link', { name: book.title })).toBeInTheDocument();
    }
    expect(screen.getByTestId('catalog-result-count')).toHaveTextContent(
      text.page.resultsCount.replace('{count}', '30'),
    );
    expect(
      screen.getByRole('navigation', { name: text.page.pagination.label }),
    ).toBeInTheDocument();
    expect(textProblems(container)).toEqual([]);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('getCategoryTree and CategoriesView', () => {
  it('renders the top-level categories of the tree sample as links', async () => {
    server.use(
      http.get(`${ORIGIN}/api/v1/categories`, () =>
        HttpResponse.json(sample('categories-tree.json')),
      ),
    );
    const tree = await getCategoryTree({ origin: ORIGIN });
    expect(tree).toHaveLength(5);
    const { container } = render(<CategoriesView categories={tree} />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    for (const category of sample<CategoryNode[]>('categories-tree.json')) {
      expect(screen.getByRole('link', { name: category.name })).toHaveAttribute(
        'href',
        `/categories/${category.slug}`,
      );
    }
    expect(textProblems(container)).toEqual([]);
    expect(await axe(container)).toHaveNoViolations();
  });
});
