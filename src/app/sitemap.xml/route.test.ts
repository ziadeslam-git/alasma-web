import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { server } from '@/mocks/server';
import { defaultApiOrigin } from '@/shared/lib/api';
import sampleSitemap from '@/test/fixtures/api-samples/sitemap-trimmed-3.json';

import { GET as getSitemapChunk } from '../sitemap/[id]/route';
import { GET as getSitemapIndex } from './route';

describe('/sitemap.xml and /sitemap/[id] routes', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('serves the sitemap index XML at /sitemap.xml and chunk XML at /sitemap/0.xml', async () => {
    vi.stubEnv('SITE_URL', 'https://alasma.com');
    server.use(
      http.get(`${defaultApiOrigin}/api/v1/sitemap`, () => HttpResponse.json(sampleSitemap)),
    );

    const indexResponse = await getSitemapIndex();
    expect(indexResponse.status).toBe(200);
    expect(indexResponse.headers.get('content-type')).toContain('application/xml');
    const indexXml = await indexResponse.text();
    expect(indexXml).toContain('<sitemapindex');
    expect(indexXml).toContain('<loc>https://alasma.com/sitemap/0.xml</loc>');

    const chunkResponse = await getSitemapChunk(new Request('https://alasma.com/sitemap/0.xml'), {
      params: Promise.resolve({ id: '0.xml' }),
    });
    expect(chunkResponse.status).toBe(200);
    const chunkXml = await chunkResponse.text();
    expect(chunkXml).toContain('<urlset');
    expect(chunkXml).toContain('<loc>https://alasma.com/books/demo-book-030-morning-star</loc>');
  });

  it('returns 404 for invalid or out-of-range chunk IDs', async () => {
    server.use(
      http.get(`${defaultApiOrigin}/api/v1/sitemap`, () => HttpResponse.json(sampleSitemap)),
    );

    const invalid = await getSitemapChunk(new Request('https://alasma.com/sitemap/invalid.xml'), {
      params: Promise.resolve({ id: 'invalid.xml' }),
    });
    expect(invalid.status).toBe(404);

    const outOfRange = await getSitemapChunk(new Request('https://alasma.com/sitemap/99.xml'), {
      params: Promise.resolve({ id: '99.xml' }),
    });
    expect(outOfRange.status).toBe(404);
  });

  it('returns 503 (never an empty sitemap) when the API is down', async () => {
    server.use(
      http.get(`${defaultApiOrigin}/api/v1/sitemap`, () =>
        HttpResponse.json({ status: 500, title: 'Server Error' }, { status: 500 }),
      ),
    );

    const indexResponse = await getSitemapIndex();
    expect(indexResponse.status).toBe(503);

    const chunkResponse = await getSitemapChunk(new Request('https://alasma.com/sitemap/0.xml'), {
      params: Promise.resolve({ id: '0.xml' }),
    });
    expect(chunkResponse.status).toBe(503);
  });
});
