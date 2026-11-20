import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { resolve } from 'node:path';

import {
  apiOrigin,
  assertIsolatedDatabase,
  blankExternalServices,
} from './support/real-api-server';
import { isApiReuseAllowed } from './support/real-api-port';

import { expect, test } from '@playwright/test';

// Opt-in real-API proof for book page JSON-LD, canonical URL, sitemap index/chunks, and the raw-HTML <h1> count of a
// real book page. Skipped unless E2E_REAL_API=1 (the skip reason below is printed in the CI log). The spec spawns its own
// API on E2E_API_PORT and needs no externally started one. Credentials are not needed.
const isEnabled = process.env.E2E_REAL_API === '1';
const apiDir = resolve(process.env.E2E_API_DIR ?? '../AlAsmaPro');
const webOrigin = 'http://localhost:3101';

const countH1 = (html: string) => (html.match(/<h1[\s>]/g) ?? []).length;

test.skip(!isEnabled, 'Set E2E_REAL_API=1 to run against the real API.');
test.describe.configure({ mode: 'serial' });
test.use({ baseURL: webOrigin });

let api: ChildProcess | undefined;
let apiLog = '';

async function startApi() {
  // Reusing a running API needs the explicit opt-in E2E_REUSE_API=1 (Task 86); otherwise always spawn an isolated one.
  if (isApiReuseAllowed()) {
    try {
      const probe = await fetch(`${apiOrigin}/api/v1/sitemap`);
      if (probe.ok) {
        return;
      }
    } catch {
      // Not running yet; spawn our own isolated API instance.
    }
  }

  assertIsolatedDatabase();
  api = spawn(
    'dotnet',
    ['run', '--project', 'src/AlAsmaPro.Api', '--no-launch-profile', '--urls', apiOrigin],
    {
      cwd: apiDir,
      env: {
        ...process.env,
        ...blankExternalServices,
        ASPNETCORE_ENVIRONMENT: 'Development',
        Cors__AllowedOrigins__0: 'http://localhost:3000',
        Cors__AllowedOrigins__1: webOrigin,
      },
    },
  );
  const collect = (chunk: Buffer) => {
    apiLog += chunk.toString();
  };
  api.stdout?.on('data', collect);
  api.stderr?.on('data', collect);

  await expect
    .poll(() => apiLog.includes('Now listening on'), { intervals: [500], timeout: 180_000 })
    .toBe(true);
}

function stopApi() {
  const pid = api?.pid;
  if (pid === undefined) {
    return;
  }

  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(pid), '/T', '/F']);
  } else {
    api?.kill('SIGTERM');
  }
}

test.beforeAll(async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1280', 'one viewport is enough for real-API SEO');
  test.setTimeout(300_000);
  await startApi();
});

test.afterAll(() => {
  stopApi();
});

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1280', 'one viewport is enough for real-API SEO');
  test.setTimeout(120_000);
});

test('/sitemap.xml lists at least one chunk and /books/[slug] renders valid Book JSON-LD and absolute canonical', async ({
  page,
  request,
}) => {
  const indexRes = await request.get('/sitemap.xml');
  expect(indexRes.status()).toBe(200);
  const indexXml = await indexRes.text();
  expect(indexXml).toContain('<sitemapindex');
  expect(indexXml).toContain('/sitemap/0.xml</loc>');

  const chunkRes = await request.get('/sitemap/0.xml');
  expect(chunkRes.status()).toBe(200);
  const chunkXml = await chunkRes.text();
  expect(chunkXml).toContain('<urlset');

  const sitemapDataRes = await fetch(`${apiOrigin}/api/v1/sitemap`);
  expect(sitemapDataRes.status).toBe(200);
  const sitemapData = (await sitemapDataRes.json()) as {
    books: Array<{ slug: string }>;
  };
  const firstBookSlug = sitemapData.books[0]?.slug;
  expect(firstBookSlug).toBeTruthy();

  const bookRes = await page.goto(`/books/${encodeURIComponent(firstBookSlug ?? '')}`);
  expect(bookRes?.status()).toBe(200);

  const canonicalHref = await page.locator('link[rel="canonical"]').getAttribute('href');
  expect(canonicalHref).toMatch(/^https?:\/\/[^/]+\/books\/.+/);

  const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(scripts.length).toBeGreaterThanOrEqual(2);

  const parsed = scripts.map((raw) => JSON.parse(raw) as Record<string, unknown>);
  const bookLd = parsed.find((node) => node['@type'] === 'Book');
  expect(bookLd).toBeDefined();
  expect(bookLd?.['@type']).toBe('Book');
  expect(bookLd).not.toHaveProperty('aggregateRating');
  expect(bookLd).not.toHaveProperty('review');

  const offer = bookLd?.offers as Record<string, unknown> | undefined;
  expect(offer?.['@type']).toBe('Offer');
  expect(typeof offer?.price).toBe('number');
  expect(offer?.priceCurrency).toBe('EGP');
});

// Moved here from raw-html.spec.ts, where it silently needed an API on 127.0.0.1:5198. It reads the RAW server HTML
// (what crawlers get) of the first book of the spawned API. The malformed-slug, skeleton and 404 checks stay there.
test('a real book page has exactly one <h1> in the raw HTML', async ({ request }) => {
  const list = await request.get(`${apiOrigin}/api/v1/books`, { timeout: 15_000 });
  expect(list.ok()).toBe(true);
  const { items } = (await list.json()) as { items: { slug: string }[] };
  const slug = items[0]?.slug;
  expect(slug).toBeTruthy();

  const response = await request.get(`/books/${encodeURIComponent(slug ?? '')}`);
  expect(response.status()).toBe(200);
  expect(countH1(await response.text())).toBe(1);
});
