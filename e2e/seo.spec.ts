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
  await expect(canonical).toHaveAttribute('href', /^https?:\/\/[^/]+\/$/);

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
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    /^https?:\/\/[^/]+\/books\?page=2$/,
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

test('/sitemap.xml returns 5xx and never an empty sitemap when the API is not running', async ({
  request,
}) => {
  const response = await request.get('/sitemap.xml');
  expect(response.status()).toBeGreaterThanOrEqual(500);
});
