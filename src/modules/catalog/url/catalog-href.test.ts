import { describe, expect, it } from 'vitest';

import { toApiQuery, type BooksApiQuery } from './catalog-api-query';
import {
  buildCatalogHref,
  clearFilters,
  countActiveFilters,
  withFilter,
  withoutFilter,
  withPage,
  withSort,
} from './catalog-href';
import { emptyCatalogParams, parseCatalogParams, type CatalogParams } from './catalog-params';

const base = (patch: Partial<CatalogParams> = {}): CatalogParams => ({
  ...emptyCatalogParams,
  ...patch,
});

describe('buildCatalogHref', () => {
  it('omits defaults and empty values', () => {
    expect(buildCatalogHref('/books', base())).toBe('/books');
    expect(buildCatalogHref('/books', base({ sort: 'newest', page: 1, inStock: false }))).toBe(
      '/books',
    );
  });

  it('writes the keys in one stable order whatever the order of the input', () => {
    const params = base({
      page: 2,
      sort: 'title',
      hasDiscount: true,
      inStock: true,
      maxPrice: 300,
      minPrice: 60,
      publisher: 'p',
      author: 'a',
      category: 'c',
      q: 'x',
    });

    expect(buildCatalogHref('/books', params)).toBe(
      '/books?q=x&category=c&author=a&publisher=p&minPrice=60&maxPrice=300&inStock=true&hasDiscount=true&sort=title&page=2',
    );
  });

  it('percent-encodes values and round-trips Arabic slugs and text', () => {
    const params = base({ category: 'روايات-عربية', q: 'ظلال & الحكاية=؟' });
    const href = buildCatalogHref('/books', params);

    expect(href).not.toMatch(/[ء-ي]/);
    expect(href).toContain('category=%D8%B1');
    const search = Object.fromEntries(new URL(href, 'http://x').searchParams);
    expect(parseCatalogParams(search)).toEqual(
      expect.objectContaining({ category: 'روايات-عربية', q: 'ظلال & الحكاية=؟' }),
    );
  });

  it('builds the same href after parsing it back (idempotent)', () => {
    const href = '/books?category=c&minPrice=10&maxPrice=20&inStock=true&sort=price_asc&page=4';
    const search = Object.fromEntries(new URL(href, 'http://x').searchParams);

    expect(buildCatalogHref('/books', parseCatalogParams(search))).toBe(href);
  });

  it('never writes an invalid value even when handed one', () => {
    const href = buildCatalogHref(
      '/books',
      base({ category: 'javascript:alert(1)', minPrice: -5, page: -2 }),
    );

    expect(href).toBe('/books');
  });

  it('keeps an existing base path as given', () => {
    expect(buildCatalogHref('/categories/novels', base({ inStock: true }))).toBe(
      '/categories/novels?inStock=true',
    );
  });
});

describe('page reset rules', () => {
  const onPageThree = base({ category: 'c', page: 3 });

  it('goes back to page 1 when a filter, the sort or the query changes', () => {
    expect(withFilter(onPageThree, { author: 'a' }).page).toBe(1);
    expect(withFilter(onPageThree, { q: 'x' }).page).toBe(1);
    expect(withFilter(onPageThree, { minPrice: 10, maxPrice: 20 }).page).toBe(1);
    expect(withFilter(onPageThree, { inStock: true }).page).toBe(1);
    expect(withSort(onPageThree, 'title').page).toBe(1);
    expect(withoutFilter(onPageThree, 'category').page).toBe(1);
    expect(clearFilters(onPageThree).page).toBe(1);
  });

  it('keeps the page when only the page changes, and keeps everything else', () => {
    const next = withPage(onPageThree, 4);

    expect(next).toEqual({ ...onPageThree, page: 4 });
    expect(buildCatalogHref('/books', next)).toBe('/books?category=c&page=4');
  });

  it('normalizes the page passed to withPage', () => {
    expect(withPage(onPageThree, -1).page).toBe(1);
    expect(withPage(onPageThree, 2.5).page).toBe(1);
  });
});

describe('filter helpers', () => {
  const all = base({
    q: 'x',
    category: 'c',
    author: 'a',
    publisher: 'p',
    minPrice: 1,
    maxPrice: 2,
    inStock: true,
    hasDiscount: true,
    sort: 'title',
    page: 5,
  });

  it('withFilter merges a patch without touching the sort or the other filters', () => {
    expect(withFilter(all, { category: 'other' })).toEqual({ ...all, category: 'other', page: 1 });
  });

  it('withFilter drops maxPrice when minPrice > maxPrice', () => {
    const next = withFilter(base(), { minPrice: 9, maxPrice: 3 });
    expect(next.minPrice).toBe(9);
    expect(next.maxPrice).toBeUndefined();
  });

  it.each([
    ['category', 'category'],
    ['author', 'author'],
    ['publisher', 'publisher'],
    ['q', 'q'],
  ] as const)('withoutFilter removes %s', (key, field) => {
    expect(withoutFilter(all, key)[field]).toBeUndefined();
  });

  it('withoutFilter removes both ends of the price range and turns the switches off', () => {
    const noPrice = withoutFilter(all, 'price');
    expect(noPrice.minPrice).toBeUndefined();
    expect(noPrice.maxPrice).toBeUndefined();
    expect(withoutFilter(all, 'inStock').inStock).toBe(false);
    expect(withoutFilter(all, 'hasDiscount').hasDiscount).toBe(false);
  });

  it('clearFilters removes every filter but keeps the search text and the sort', () => {
    expect(clearFilters(all)).toEqual(base({ q: 'x', sort: 'title' }));
    expect(buildCatalogHref('/books', clearFilters(all))).toBe('/books?q=x&sort=title');
  });

  it('countActiveFilters counts the price range once and ignores the search text and sort', () => {
    expect(countActiveFilters(base())).toBe(0);
    expect(countActiveFilters(base({ q: 'x', sort: 'title' }))).toBe(0);
    expect(countActiveFilters(all)).toBe(6);
    expect(countActiveFilters(base({ maxPrice: 5 }))).toBe(1);
  });
});

describe('toApiQuery', () => {
  it('maps only what is set and sends the page', () => {
    expect(toApiQuery(base())).toEqual({ page: 1 });
  });

  it('maps every field to the parameter name of GET /books', () => {
    const query = toApiQuery(
      base({
        q: 'x',
        category: 'c',
        author: 'a',
        publisher: 'p',
        minPrice: 60,
        maxPrice: 300,
        inStock: true,
        hasDiscount: true,
        sort: 'price_asc',
        page: 2,
      }),
    );

    expect(query).toEqual({
      q: 'x',
      category: 'c',
      author: 'a',
      publisher: 'p',
      minPrice: 60,
      maxPrice: 300,
      inStock: true,
      hasDiscount: true,
      sort: 'price_asc',
      page: 2,
    });
  });

  it('type-checks against the generated GET /books query and its sort enum', () => {
    const query: BooksApiQuery = toApiQuery(base({ sort: 'title' }));
    const sort: BooksApiQuery['sort'] = query.sort;

    expect(sort).toBe('title');
  });

  it('clamps pageSize to what the backend accepts and drops a non-integer', () => {
    expect(toApiQuery(base(), { pageSize: 100 }).pageSize).toBe(48);
    expect(toApiQuery(base(), { pageSize: 0 }).pageSize).toBe(1);
    expect(toApiQuery(base(), { pageSize: 12 }).pageSize).toBe(12);
    expect(toApiQuery(base(), { pageSize: 1.5 }).pageSize).toBeUndefined();
  });
});
