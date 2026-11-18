import { describe, expect, it } from 'vitest';

import type { CatalogBooksResult } from '../types';
import { getOutOfRangeHref } from './page-range';
import { parseCatalogParams } from './catalog-params';

const books = (patch: Partial<CatalogBooksResult>): CatalogBooksResult => ({
  status: 'empty',
  items: [],
  page: 5,
  pageSize: 12,
  totalCount: 20,
  totalPages: 2,
  ...patch,
});

describe('getOutOfRangeHref', () => {
  it('points a page beyond the last one at the last valid page, keeping the other parameters', () => {
    const params = parseCatalogParams({ page: '5', sort: 'price_asc', q: 'نور' });
    expect(getOutOfRangeHref(books({}), params)).toBe(
      `/books?${new URLSearchParams({ q: 'نور', sort: 'price_asc', page: '2' }).toString()}`,
    );
  });

  it('drops the page parameter when the last valid page is the first', () => {
    const params = parseCatalogParams({ page: '9' });
    expect(getOutOfRangeHref(books({ totalCount: 6, totalPages: 1 }), params)).toBe('/books');
  });

  it('uses the given base path', () => {
    const params = parseCatalogParams({ page: '9' });
    expect(getOutOfRangeHref(books({}), params, '/categories/novels')).toBe(
      '/categories/novels?page=2',
    );
  });

  it('does nothing for a page in range, a genuinely empty result, or a failed load', () => {
    expect(
      getOutOfRangeHref(
        books({ status: 'ok', items: [{} as never], page: 2 }),
        parseCatalogParams({ page: '2' }),
      ),
    ).toBeNull();
    expect(
      getOutOfRangeHref(books({ totalCount: 0, totalPages: 0 }), parseCatalogParams({ page: '3' })),
    ).toBeNull();
    expect(
      getOutOfRangeHref(books({ status: 'error' }), parseCatalogParams({ page: '5' })),
    ).toBeNull();
    expect(
      getOutOfRangeHref(books({ status: 'invalid' }), parseCatalogParams({ page: '5' })),
    ).toBeNull();
  });
});
