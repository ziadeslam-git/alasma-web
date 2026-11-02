import fs from 'node:fs';
import path from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import AccountDevPage from './account/page';
import AddressesDevPage from './addresses/page';
import AuthDevPage from './auth/page';
import AuthorsDevPage from './authors/page';
import BookDevPage from './book/page';
import BooksDevPage from './books/page';
import CartDevPage from './cart/page';
import CatalogDevPage from './catalog/page';
import CatalogFiltersDevPage from './catalog-filters/page';
import CategoryDevPage from './category/page';
import CategoriesDevPage from './categories/page';
import ComponentsPage from './components/page';
import ErrorTestPage from './error-test/page';
import HomeDevPage from './home/page';
import IconsPage from './icons/page';
import OrdersDevPage from './orders/page';
import PageCmsDevPage from './page-cms/page';
import SearchDevPage from './search/page';
import TokensPage from './tokens/page';

const NOT_FOUND_SENTINEL = 'NEXT_NOT_FOUND';

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error(NOT_FOUND_SENTINEL);
  },
}));

describe('dev routes production guard', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([
    ['/dev/account', () => AccountDevPage()],
    ['/dev/addresses', () => AddressesDevPage()],
    ['/dev/auth', () => AuthDevPage()],
    ['/dev/authors', () => AuthorsDevPage({ searchParams: Promise.resolve({}) })],
    ['/dev/book', () => BookDevPage({ searchParams: Promise.resolve({}) })],
    ['/dev/books', () => BooksDevPage({ searchParams: Promise.resolve({}) })],
    ['/dev/cart', () => CartDevPage()],
    ['/dev/catalog', () => CatalogDevPage()],
    ['/dev/catalog-filters', () => CatalogFiltersDevPage({ searchParams: Promise.resolve({}) })],
    ['/dev/category', () => CategoryDevPage()],
    ['/dev/categories', () => CategoriesDevPage()],
    ['/dev/components', () => ComponentsPage()],
    ['/dev/error-test', () => ErrorTestPage()],
    ['/dev/home', () => HomeDevPage({ searchParams: Promise.resolve({}) })],
    ['/dev/icons', () => IconsPage()],
    ['/dev/orders', () => OrdersDevPage()],
    ['/dev/page-cms', () => PageCmsDevPage()],
    ['/dev/search', () => SearchDevPage()],
    ['/dev/tokens', () => TokensPage()],
  ])('calls notFound() on %s when NODE_ENV is production', async (_route, renderPage) => {
    vi.stubEnv('NODE_ENV', 'production');

    await expect(Promise.resolve().then(renderPage)).rejects.toThrow(NOT_FOUND_SENTINEL);
  });

  it('guards every page.tsx under src/app/(dev)/dev', () => {
    const devRoot = path.resolve(process.cwd(), 'src/app/(dev)/dev');
    const entries = fs.readdirSync(devRoot, { withFileTypes: true });
    const routeDirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);

    expect(routeDirs.sort()).toEqual([
      'account',
      'addresses',
      'auth',
      'authors',
      'book',
      'books',
      'cart',
      'catalog',
      'catalog-filters',
      'categories',
      'category',
      'components',
      'error-test',
      'home',
      'icons',
      'orders',
      'page-cms',
      'search',
      'tokens',
    ]);

    for (const dir of routeDirs) {
      const pagePath = path.join(devRoot, dir, 'page.tsx');
      const source = fs.readFileSync(pagePath, 'utf8');
      expect(source).toContain("process.env.NODE_ENV === 'production'");
      expect(source).toContain('notFound()');
    }
  });
});
