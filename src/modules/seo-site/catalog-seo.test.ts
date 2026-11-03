import { afterEach, describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { parseCatalogParams } from '@/modules/catalog';

import {
  buildBooksCatalogMetadata,
  buildCategoryCatalogMetadata,
  resolveCatalogSeoRule,
} from './catalog-seo';

describe('catalog and category SEO rules (Decision 20)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('indexes /books with canonical /books when there are no query params or page=1', () => {
    vi.stubEnv('SITE_URL', 'https://alasma.com');

    const noParams = buildBooksCatalogMetadata({});
    expect(noParams.title).toBe(messages.catalog.page.meta.title);
    expect(noParams.description).toBe(messages.catalog.page.meta.description);
    expect(noParams.alternates?.canonical).toBe('https://alasma.com/books');
    expect(noParams.robots).toEqual({ index: true, follow: true });

    const pageOne = buildBooksCatalogMetadata({ page: '1' });
    expect(pageOne.alternates?.canonical).toBe('https://alasma.com/books');
    expect(pageOne.robots).toEqual({ index: true, follow: true });
  });

  it('indexes /books?page=N with self canonical when pagination is used alone', () => {
    vi.stubEnv('SITE_URL', 'https://alasma.com');

    const pageThree = buildBooksCatalogMetadata({ page: '3' });
    expect(pageThree.alternates?.canonical).toBe('https://alasma.com/books?page=3');
    expect(pageThree.robots).toEqual({ index: true, follow: true });
  });

  it.each([
    ['category', { category: 'novels' }],
    ['author', { author: 'sami-alhakim' }],
    ['publisher', { publisher: 'dar-al-asma' }],
    ['minPrice', { minPrice: '50' }],
    ['maxPrice', { maxPrice: '200' }],
    ['inStock', { inStock: 'true' }],
    ['hasDiscount', { hasDiscount: 'true' }],
    ['sort', { sort: 'price_asc' }],
    ['q', { q: 'نجيب' }],
  ])(
    'marks /books as noindex,follow with canonical /books when %s is set',
    (_label, searchParams) => {
      vi.stubEnv('SITE_URL', 'https://alasma.com');

      const meta = buildBooksCatalogMetadata(searchParams);
      expect(meta.alternates?.canonical).toBe('https://alasma.com/books');
      expect(meta.robots).toEqual({ index: false, follow: true });
    },
  );

  it('marks /books as noindex,follow with canonical /books when several filters and page are combined', () => {
    vi.stubEnv('SITE_URL', 'https://alasma.com');

    const meta = buildBooksCatalogMetadata({
      category: 'novels',
      author: 'sami-alhakim',
      minPrice: '50',
      maxPrice: '250',
      inStock: 'true',
      sort: 'price_desc',
      page: '2',
    });

    expect(meta.alternates?.canonical).toBe('https://alasma.com/books');
    expect(meta.robots).toEqual({ index: false, follow: true });
  });

  it('marks /books as noindex,follow with canonical /books when filter or page values are invalid', () => {
    vi.stubEnv('SITE_URL', 'https://alasma.com');

    for (const invalidParams of [
      { category: 'javascript:alert(1)' },
      { minPrice: '-10' },
      { maxPrice: 'abc' },
      { sort: 'popular' },
      { page: '0' },
      { page: '999999' },
      { inStock: 'invalid' },
    ]) {
      const meta = buildBooksCatalogMetadata(invalidParams);
      expect(meta.alternates?.canonical).toBe('https://alasma.com/books');
      expect(meta.robots).toEqual({ index: false, follow: true });
    }
  });

  it('applies the same canonical and noindex,follow rules to /categories/[slug]', () => {
    vi.stubEnv('SITE_URL', 'https://alasma.com');
    const category = { name: 'الروايات', slug: 'novels', imageUrl: null };

    const baseMeta = buildCategoryCatalogMetadata(category, {});
    expect(baseMeta.title).toBe('الروايات');
    expect(baseMeta.alternates?.canonical).toBe('https://alasma.com/categories/novels');
    expect(baseMeta.robots).toEqual({ index: true, follow: true });

    const pagedMeta = buildCategoryCatalogMetadata(category, { page: '2' });
    expect(pagedMeta.alternates?.canonical).toBe('https://alasma.com/categories/novels?page=2');
    expect(pagedMeta.robots).toEqual({ index: true, follow: true });

    const filteredMeta = buildCategoryCatalogMetadata(category, {
      author: 'sami-alhakim',
      page: '2',
    });
    expect(filteredMeta.alternates?.canonical).toBe('https://alasma.com/categories/novels');
    expect(filteredMeta.robots).toEqual({ index: false, follow: true });

    const directRule = resolveCatalogSeoRule(
      '/categories/novels',
      parseCatalogParams({ q: 'شعر' }),
    );
    expect(directRule).toEqual({
      canonicalPath: '/categories/novels',
      noindex: true,
      follow: true,
    });
  });
});
