import { writeFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import messages from '../src/i18n/messages/ar.json';
import {
  apiOrigin,
  isRealApiEnabled,
  realApiSkipReason,
  startRealApi,
  stopRealApi,
  webOrigin,
} from './support/real-api-server';

// Task 79, parts B and C against the real API (the isolated FrontendDev database): one h1 per page, the sitemap, the
// BreadcrumbList JSON-LD, the footer CMS links and the feature flags the API returns. E2E_CAPTURE_DIR, when set, also
// gets flags-enabled.json (what GET /api/v1/feature-flags/enabled returned).
const captureDir = process.env.E2E_CAPTURE_DIR;

test.skip(!isRealApiEnabled, realApiSkipReason);
test.describe.configure({ mode: 'default' });
test.use({ baseURL: webOrigin });

const cmsKeys = [
  'about',
  'contact',
  'privacy-policy',
  'terms',
  'shipping-policy',
  'return-policy',
  'payment-methods',
  'faq',
];

let bookSlug: string;
let authorSlug: string;
let categorySlug: string;
let bookTitle: string;
let flags: unknown;

test.beforeAll(async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1280', 'these checks do not depend on the viewport');
  test.setTimeout(300_000);
  await startRealApi();
  const json = async <T>(url: string) => (await (await fetch(`${apiOrigin}${url}`)).json()) as T;
  const book = (
    await json<{ items: { slug: string; title: string }[] }>('/api/v1/books?page=1&pageSize=1')
  ).items[0]!;
  bookSlug = book.slug;
  bookTitle = book.title;
  authorSlug = (await json<{ items: { slug: string }[] }>('/api/v1/authors?page=1&pageSize=1'))
    .items[0]!.slug;
  categorySlug = (await json<{ slug: string; bookCount: number }[]>('/api/v1/categories')).find(
    (c) => c.bookCount > 0,
  )!.slug;
  flags = await json<unknown>('/api/v1/feature-flags/enabled');
  if (captureDir)
    writeFileSync(path.join(captureDir, 'flags-enabled.json'), JSON.stringify(flags, null, 2));
});

test.afterAll(() => {
  stopRealApi();
});

test('B1 every page has exactly one h1, with the API running', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1280', 'these checks do not depend on the viewport');
  const routes = [
    '/',
    '/books',
    `/books?q=${encodeURIComponent(bookTitle.split(' ')[0] ?? 'a')}`,
    '/books?sort=price_asc&page=1',
    '/authors',
    '/categories',
    `/categories/${encodeURIComponent(categorySlug)}`,
    `/books/${encodeURIComponent(bookSlug)}`,
    `/authors/${encodeURIComponent(authorSlug)}`,
  ];
  const report: Record<string, string[]> = {};
  for (const width of [360, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      await page.goto(route);
      // Task 82: `load` fires while React is still finishing the streamed page. For a moment the finished page is in
      // <main> AND its streaming copy is still in the hidden segment <div id="S:n" hidden> that React removes right after
      // (seen in 3 of ~250 runs, always on /books). A locator('h1') counts that hidden copy, so the check read "two h1"
      // although the page, its accessibility tree and its raw HTML have one. So: wait until the streaming segments are
      // gone (the settled state, no sleep), then count the headings a user or a screen reader actually has.
      await expect(page.locator('div[id^="S:"]')).toHaveCount(0);
      const headings = page.getByRole('heading', { level: 1 });
      report[`${route} @${width}`] = await headings.allTextContents();
      // the raw HTML (what a crawler without JavaScript reads) has one h1 as well: the streamed loading skeleton had its own
      const raw = await (await page.request.get(route)).text();
      report[`${route} raw`] = Array.from(raw.matchAll(/<h1[\s>]/g)).map(() => 'h1');
      if (report[`${route} @${width}`]?.length !== 1 || report[`${route} raw`]?.length !== 1) {
        // keep the evidence of a real failure: the DOM and the raw HTML, written to E2E_CAPTURE_DIR when it is set
        const label = `${route} @${width}`.replace(/[^a-z0-9]+/gi, '_');
        const evidence = {
          [`${label}-dom.html`]: await page.content(),
          [`${label}-raw.html`]: raw,
        };
        for (const [name, body] of Object.entries(evidence)) {
          await testInfo.attach(name, { body, contentType: 'text/plain' });
          if (captureDir) writeFileSync(path.join(captureDir, name), body);
        }
      }
    }
  }
  const wrong = Object.entries(report).filter(([, headings]) => headings.length !== 1);
  expect(wrong, JSON.stringify(report)).toEqual([]);
});

test('B3 sitemap.xml is a valid sitemap index whose children are valid urlsets that list the real pages', async ({
  page,
  request,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1280', 'these checks do not depend on the viewport');
  await page.goto('about:blank');
  const parse = (text: string) =>
    page.evaluate((xml) => {
      const doc = new DOMParser().parseFromString(xml, 'application/xml');
      return {
        hasError: doc.querySelector('parsererror') !== null,
        root: doc.documentElement.localName,
        locs: Array.from(doc.getElementsByTagName('loc')).map((loc) => loc.textContent ?? ''),
      };
    }, text);

  const response = await request.get('/sitemap.xml');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toMatch(/xml/);
  const index = await parse(await response.text());
  expect(index.hasError).toBe(false);
  expect(index.root).toBe('sitemapindex');
  expect(index.locs.length).toBeGreaterThan(0);

  // the index lists absolute URLs on SITE_URL (localhost:3000 locally); each child is fetched by its path
  const urls: string[] = [];
  for (const loc of index.locs) {
    expect(loc).toMatch(/^https?:\/\/[^\s]+$/);
    const child = await request.get(new URL(loc).pathname);
    expect(child.status(), loc).toBe(200);
    expect(child.headers()['content-type']).toMatch(/xml/);
    const parsed = await parse(await child.text());
    expect(parsed.hasError, loc).toBe(false);
    expect(parsed.root, loc).toBe('urlset');
    urls.push(...parsed.locs);
  }
  expect(urls.length).toBeGreaterThan(5);
  for (const url of urls) expect(url).toMatch(/^https?:\/\/[^\s]+$/);
  expect(new Set(urls).size).toBe(urls.length);
  const paths = urls.map((url) => decodeURIComponent(new URL(url).pathname));
  expect(paths).toContain(`/books/${bookSlug}`);
  expect(paths).toContain(`/authors/${authorSlug}`);
  expect(paths).toContain(`/categories/${categorySlug}`);
});

type ListItem = { '@type'?: string; position?: number; name?: string; item?: string };

async function breadcrumbLd(page: import('@playwright/test').Page) {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  const parsed = blocks.map((text) => JSON.parse(text) as Record<string, unknown>);
  const flat = parsed.flatMap((entry) =>
    Array.isArray(entry['@graph']) ? (entry['@graph'] as Record<string, unknown>[]) : [entry],
  );
  return flat.find((entry) => entry['@type'] === 'BreadcrumbList') as
    { '@context'?: string; itemListElement?: ListItem[] } | undefined;
}

function expectValidBreadcrumb(list: Awaited<ReturnType<typeof breadcrumbLd>>) {
  expect(list, 'a BreadcrumbList JSON-LD block exists').toBeDefined();
  const items = list!.itemListElement ?? [];
  expect(items.length).toBeGreaterThanOrEqual(2);
  items.forEach((item, index) => {
    expect(item['@type']).toBe('ListItem');
    expect(item.position).toBe(index + 1);
    expect(typeof item.name).toBe('string');
    expect((item.name ?? '').length).toBeGreaterThan(0);
    // every item but the last carries an absolute URL; the last (the page itself) may omit it
    if (index < items.length - 1) expect(item.item).toMatch(/^https?:\/\//);
  });
}

test('B3 the book page has a valid BreadcrumbList JSON-LD', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1280', 'these checks do not depend on the viewport');
  await page.goto(`/books/${encodeURIComponent(bookSlug)}`);
  expectValidBreadcrumb(await breadcrumbLd(page));
});

test('B3 the category page has a valid BreadcrumbList JSON-LD', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1280', 'these checks do not depend on the viewport');
  await page.goto(`/categories/${encodeURIComponent(categorySlug)}`);
  expectValidBreadcrumb(await breadcrumbLd(page));
});

test('C the footer CMS links are live links to pages that answer 200', async ({
  page,
  request,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1280', 'these checks do not depend on the viewport');
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  const footer = page.getByRole('contentinfo');
  const hrefs: string[] = [];
  for (const key of cmsKeys) {
    const link = footer.locator(`a[href="/pages/${key}"]`);
    await expect(link, `footer link for ${key}`).toHaveCount(1);
    hrefs.push(`/pages/${key}`);
  }
  for (const href of hrefs) {
    const response = await request.get(href);
    expect(response.status(), href).toBe(200);
  }
  // none of them is dimmed or inert
  await expect(footer.locator('[data-feature="static-pages"][inert]')).toHaveCount(0);
  await expect(footer.getByText(messages.site.soon)).toHaveCount(2); // only the publish-packages entry and the newsletter stay soon
});

test('C the API answers the feature flags endpoint', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1280', 'these checks do not depend on the viewport');
  expect(flags).toBeDefined();
});
