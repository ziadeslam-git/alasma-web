import { describe, expect, it } from 'vitest';

import {
  MAX_PAGE,
  MAX_PRICE,
  MAX_QUERY_LENGTH,
  MAX_SLUG_LENGTH,
  parseCatalogParams,
} from './catalog-params';

const defaults = { inStock: false, hasDiscount: false, sort: 'newest', page: 1 };

describe('parseCatalogParams', () => {
  it('returns the defaults for an empty object and never throws on non-objects', () => {
    expect(parseCatalogParams({})).toEqual(defaults);
    for (const input of [null, undefined, 'x', 5, true, [], () => 1]) {
      expect(() => parseCatalogParams(input)).not.toThrow();
      expect(parseCatalogParams(input)).toEqual(defaults);
    }
  });

  it('accepts every documented value', () => {
    expect(
      parseCatalogParams({
        q: ' ليالي ',
        category: 'novels',
        author: '12',
        publisher: 'dar-al-asma',
        minPrice: '60',
        maxPrice: '350.5',
        inStock: 'true',
        hasDiscount: 'true',
        sort: 'price_desc',
        page: '3',
      }),
    ).toEqual({
      q: 'ليالي',
      category: 'novels',
      author: '12',
      publisher: 'dar-al-asma',
      minPrice: 60,
      maxPrice: 350.5,
      inStock: true,
      hasDiscount: true,
      sort: 'price_desc',
      page: 3,
    });
  });

  it('drops unknown keys, including prototype keys', () => {
    const parsed = parseCatalogParams({
      foo: 'bar',
      pageSize: '48',
      __proto__: 'x',
      constructor: 'y',
    });
    expect(parsed).toEqual(defaults);
    expect(Object.keys(parsed).sort()).toEqual(['hasDiscount', 'inStock', 'page', 'sort']);
  });

  it('uses the first value of a repeated key and does not fall back when it is invalid', () => {
    expect(parseCatalogParams({ category: ['a', 'b'] }).category).toBe('a');
    expect(parseCatalogParams({ category: ['bad value!', 'good'] }).category).toBeUndefined();
    expect(parseCatalogParams({ sort: ['title', 'newest'] }).sort).toBe('title');
    expect(parseCatalogParams({ page: [] }).page).toBe(1);
  });

  it.each([
    ['newest', 'newest'],
    ['price_asc', 'price_asc'],
    ['price_desc', 'price_desc'],
    ['title', 'title'],
    ['popular', 'newest'],
    ['PRICE_ASC', 'newest'],
    ['', 'newest'],
    ['title;drop', 'newest'],
  ])('sort %j becomes %j (whitelist, default newest)', (value, expected) => {
    expect(parseCatalogParams({ sort: value }).sort).toBe(expected);
  });

  it.each([
    ['1', 1],
    ['42', 42],
    ['0', 1],
    ['-3', 1],
    ['2.5', 1],
    ['1e3', 1],
    ['abc', 1],
    ['', 1],
    ['007', 1],
    [String(MAX_PAGE), MAX_PAGE],
    [String(MAX_PAGE + 1), 1],
    ['99999999999999999999', 1],
    ['NaN', 1],
  ])('page %j becomes %j (positive integer, default 1)', (value, expected) => {
    expect(parseCatalogParams({ page: value }).page).toBe(expected);
  });

  it.each([
    ['0', 0],
    ['100', 100],
    ['99.5', 99.5],
    ['99.99', 99.99],
    ['99.999', undefined],
    ['-1', undefined],
    ['NaN', undefined],
    ['Infinity', undefined],
    ['1e3', undefined],
    ['0x10', undefined],
    ['', undefined],
    [' 5 ', 5],
    ['5,5', undefined],
    [String(MAX_PRICE + 1), undefined],
  ])('minPrice %j becomes %j', (value, expected) => {
    expect(parseCatalogParams({ minPrice: value }).minPrice).toBe(expected);
  });

  it('swaps a minimum above the maximum', () => {
    const parsed = parseCatalogParams({ minPrice: '300', maxPrice: '100' });
    expect(parsed.minPrice).toBe(100);
    expect(parsed.maxPrice).toBe(300);
    expect(parseCatalogParams({ minPrice: '100', maxPrice: '100' })).toMatchObject({
      minPrice: 100,
      maxPrice: 100,
    });
  });

  it('keeps one valid end when the other end is invalid', () => {
    expect(parseCatalogParams({ minPrice: 'x', maxPrice: '50' })).toMatchObject({ maxPrice: 50 });
    expect(parseCatalogParams({ minPrice: 'x', maxPrice: '50' }).minPrice).toBeUndefined();
  });

  it.each([
    ['true', true],
    ['false', false],
    ['1', false],
    ['TRUE', false],
    ['yes', false],
    ['', false],
    [undefined, false],
  ])('boolean %j becomes %j (only "true" turns it on)', (value, expected) => {
    expect(parseCatalogParams({ inStock: value, hasDiscount: value })).toMatchObject({
      inStock: expected,
      hasDiscount: expected,
    });
  });

  it('keeps Arabic slugs as they are', () => {
    expect(parseCatalogParams({ category: 'روايات-عربية', author: 'سامي_الحكيم' })).toMatchObject({
      category: 'روايات-عربية',
      author: 'سامي_الحكيم',
    });
  });

  it('survives hostile input without throwing and without letting it through', () => {
    const hostile = [
      'javascript:alert(1)',
      '<script>alert(1)</script>',
      '"><img src=x onerror=alert(1)>',
      'a[b][c]',
      '../../etc/passwd',
      'a b',
      'a%20b',
      'a/b',
      'x'.repeat(MAX_SLUG_LENGTH + 1),
      '\u0000',
    ];
    for (const value of hostile) {
      const parsed = parseCatalogParams({ category: value, author: value, publisher: value });
      expect(parsed.category).toBeUndefined();
      expect(parsed.author).toBeUndefined();
      expect(parsed.publisher).toBeUndefined();
    }

    const nested = parseCatalogParams({
      'category[a]': 'x',
      category: { a: 'b' } as never,
      page: { a: 1 } as never,
    });
    expect(nested).toEqual(defaults);
  });

  it('limits the free-text query and rejects control characters', () => {
    expect(parseCatalogParams({ q: 'a'.repeat(MAX_QUERY_LENGTH) }).q).toHaveLength(
      MAX_QUERY_LENGTH,
    );
    expect(parseCatalogParams({ q: 'a'.repeat(MAX_QUERY_LENGTH + 1) }).q).toBeUndefined();
    expect(parseCatalogParams({ q: '   ' }).q).toBeUndefined();
    expect(parseCatalogParams({ q: 'a\u0007b' }).q).toBeUndefined();
    // HTML in the text is only text: React escapes it and the href helper encodes it.
    expect(parseCatalogParams({ q: '<b>x</b>' }).q).toBe('<b>x</b>');
  });
});
