import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { server } from '@/mocks/server';
import { defaultApiOrigin } from '@/shared/lib/api';
import sampleSitemap from '@/test/fixtures/api-samples/sitemap-trimmed-3.json';

import {
  buildSitemapChunkXml,
  buildSitemapIndexXml,
  chunkSitemapEntries,
  collectSitemapEntries,
  getSitemapData,
  MAX_SITEMAP_URLS,
  parseSitemapChunkId,
  type SitemapData,
  type SitemapUrlEntry,
} from './sitemap';

describe('sitemap builders and fetcher', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('collects static entries, books, authors, categories and valid CMS pages with percent-encoded slugs and UTC lastmod', () => {
    vi.stubEnv('SITE_URL', 'https://alasma.com');

    const data: SitemapData = {
      ...sampleSitemap,
      books: [...sampleSitemap.books, { slug: 'ظلال-الحكاية', updatedAt: '2026-11-03T10:00:00Z' }],
      pages: [
        ...sampleSitemap.pages,
        { key: 'unknown-page', updatedAt: '2026-11-03T10:00:00Z' },
        { key: 'INVALID_UPPER', updatedAt: '2026-11-03T10:00:00Z' },
        { key: 'a'.repeat(55), updatedAt: '2026-11-03T10:00:00Z' },
      ],
    };

    const entries = collectSitemapEntries(data);

    // 4 static + 4 books + 3 authors + 3 categories + 3 valid pages (3 invalid pages skipped) = 17
    expect(entries).toHaveLength(17);
    expect(entries.slice(0, 4).map((e) => e.loc)).toEqual([
      'https://alasma.com/',
      'https://alasma.com/books',
      'https://alasma.com/authors',
      'https://alasma.com/categories',
    ]);

    const arabicBook = entries.find((e) => e.loc.includes(encodeURIComponent('ظلال-الحكاية')));
    expect(arabicBook).toEqual({
      loc: `https://alasma.com/books/${encodeURIComponent('ظلال-الحكاية')}`,
      lastmod: '2026-11-03T10:00:00.000Z',
    });

    const pageUrls = entries.filter((e) => e.loc.includes('/pages/')).map((e) => e.loc);
    expect(pageUrls).toEqual([
      'https://alasma.com/pages/about',
      'https://alasma.com/pages/contact',
      'https://alasma.com/pages/faq',
    ]);
  });

  it('splits URL lists into chunks of at most 50,000 URLs and builds valid index and chunk XML', () => {
    vi.stubEnv('SITE_URL', 'https://alasma.com');

    const total = MAX_SITEMAP_URLS + 25;
    const entries: SitemapUrlEntry[] = Array.from({ length: total }, (_, index) => ({
      loc: `https://alasma.com/books/book-${index}`,
      lastmod: '2026-11-03T00:00:00.000Z',
    }));

    const chunks = chunkSitemapEntries(entries);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toHaveLength(MAX_SITEMAP_URLS);
    expect(chunks[1]).toHaveLength(25);

    const indexXml = buildSitemapIndexXml(chunks);
    expect(indexXml).toContain(
      '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    );
    expect(indexXml).toContain('<loc>https://alasma.com/sitemap/0.xml</loc>');
    expect(indexXml).toContain('<loc>https://alasma.com/sitemap/1.xml</loc>');

    const chunkXml = buildSitemapChunkXml(chunks[1] ?? []);
    expect(chunkXml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(chunkXml).toContain('<loc>https://alasma.com/books/book-50000</loc>');
    expect(chunkXml).toContain('<lastmod>2026-11-03T00:00:00.000Z</lastmod>');
  });

  it('parses chunk IDs with or without .xml suffix and rejects invalid IDs', () => {
    expect(parseSitemapChunkId('0')).toBe(0);
    expect(parseSitemapChunkId('0.xml')).toBe(0);
    expect(parseSitemapChunkId('3.xml')).toBe(3);
    expect(parseSitemapChunkId('-1.xml')).toBeNull();
    expect(parseSitemapChunkId('01.xml')).toBeNull();
    expect(parseSitemapChunkId('abc.xml')).toBeNull();
  });

  it('fetches /api/v1/sitemap and throws when the API fails so no empty sitemap is served', async () => {
    server.use(
      http.get(`${defaultApiOrigin}/api/v1/sitemap`, () => HttpResponse.json(sampleSitemap)),
    );

    const data = await getSitemapData();
    expect(data.books).toHaveLength(3);

    server.use(
      http.get(`${defaultApiOrigin}/api/v1/sitemap`, () =>
        HttpResponse.json({ status: 503, title: 'Service Unavailable' }, { status: 503 }),
      ),
    );

    await expect(getSitemapData()).rejects.toThrow();
  });
});
