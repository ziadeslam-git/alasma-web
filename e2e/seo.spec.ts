import { expect, test } from '@playwright/test';

import messages from '../src/i18n/messages/ar.json';

test('robots.txt allows /, disallows private prefixes and points to /sitemap.xml', async ({
  request,
}) => {
  const response = await request.get('/robots.txt');
  expect(response.status()).toBe(200);
  expect(response.headers()['x-powered-by']).toBeUndefined();

  const text = await response.text();
  expect(text).toContain('User-Agent: *');
  expect(text).toContain('Allow: /');
  for (const disallowed of ['/account', '/admin', '/cart', '/checkout', '/dev', '/api']) {
    expect(text).toContain(`Disallow: ${disallowed}`);
  }
  expect(text).toMatch(/Sitemap:\s*https?:\/\/[^\s]+\/sitemap\.xml/i);
});

test('home page renders canonical, index,follow robots and Organization + WebSite JSON-LD', async ({
  page,
}) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  expect(response?.headers()['x-powered-by']).toBeUndefined();

  const canonical = page.locator('link[rel="canonical"]');
  // Next.js drops the slash for the root URL (resolve-url.js); `http://host` and `http://host/` are equivalent.
  await expect(canonical).toHaveAttribute('href', /^https?:\/\/[^/]+\/?$/);

  const robotsMeta = page.locator('meta[name="robots"]');
  await expect(robotsMeta).toHaveAttribute('content', /index,\s*follow/i);

  const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
  const parsed = scripts.map((raw) => JSON.parse(raw) as Record<string, unknown>);

  const orgLd = parsed.find((node) => node['@type'] === 'Organization');
  const siteLd = parsed.find((node) => node['@type'] === 'WebSite');

  expect(orgLd).toMatchObject({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: messages.seo.siteName,
  });
  expect(String(orgLd?.logo ?? '')).toMatch(/^https?:\/\/[^/]+\/logo-alasma\.svg$/);

  expect(siteLd).toMatchObject({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: messages.seo.siteName,
    potentialAction: {
      '@type': 'SearchAction',
      'query-input': 'required name=search_term_string',
    },
  });
  expect(
    String((siteLd?.potentialAction as Record<string, unknown> | undefined)?.target ?? ''),
  ).toMatch(/^https?:\/\/[^/]+\/books\?q=\{search_term_string\}$/);
});

test('/books enforces Decision 20 canonical and robots meta for default, pagination and filters', async ({
  page,
}) => {
  await page.goto('/books');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    /^https?:\/\/[^/]+\/books$/,
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /index,\s*follow/i);

  await page.goto('/books?page=2');
  // With real data that fits on one page, page 2 is beyond the last page and is redirected to /books (Task 76), so the
  // canonical is checked against the URL the visitor ends on: it always points at itself.
  const landed = new URL(page.url());
  const landedPath = `${landed.pathname}${landed.search}`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    new RegExp(`^https?://[^/]+${landedPath}$`),
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /index,\s*follow/i);

  await page.goto('/books?category=novels&page=2');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    /^https?:\/\/[^/]+\/books$/,
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    /noindex,\s*follow/i,
  );
});

test('auth and private pages render noindex robots meta', async ({ page }) => {
  for (const path of ['/login', '/register', '/forgot-password', '/cart']) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/i);
  }
});

// Same default as the app (AGENTS.md: API_ORIGIN defaults to http://127.0.0.1:5198).
const apiOrigin = process.env.API_ORIGIN ?? 'http://127.0.0.1:5198';

test('/sitemap.xml returns 5xx and never an empty sitemap when the API is not running', async ({
  request,
}) => {
  // The 5xx contract is covered by unit tests (sitemap.test.ts, sitemap.xml/route.test.ts). This e2e check only
  // makes sense when the API is really down, so it skips when the API answers.
  const isApiUp = await request
    .get(`${apiOrigin}/api/v1/sitemap`, { timeout: 15_000 })
    .then((probe) => probe.ok())
    .catch(() => false);
  test.skip(
    isApiUp,
    `The API at ${apiOrigin} is reachable; the API-down case is covered by unit tests.`,
  );

  const response = await request.get('/sitemap.xml');
  expect(response.status()).toBeGreaterThanOrEqual(500);
});

// Task 81: /favicon.ico was a 404 on every page; the icons now come from the Next.js metadata file conventions.
test('serves /favicon.ico and links the app icon from the page head', async ({ page, request }) => {
  const favicon = await request.get('/favicon.ico');
  expect(favicon.status()).toBe(200);
  expect(favicon.headers()['content-type']).toMatch(/image\/(x-icon|vnd\.microsoft\.icon)/);
  expect((await favicon.body()).length).toBeGreaterThan(0);

  await page.goto('/');
  const icon = page.locator('link[rel="icon"][type="image/svg+xml"]');
  await expect(icon).toHaveCount(1);
  const svg = await request.get((await icon.getAttribute('href')) ?? '');
  expect(svg.status()).toBe(200);
});
