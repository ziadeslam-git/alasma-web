import { expect, test } from '@playwright/test';

import messages from '../src/i18n/messages/ar.json';

// Uses the dev server (port 3101) so /dev/book is reachable without the backend API.
test.use({ baseURL: 'http://localhost:3101' });

test('/dev/book renders valid Book and BreadcrumbList JSON-LD across stock and discount states', async ({
  page,
}) => {
  const response = await page.goto('/dev/book?state=discounted');
  expect(response?.status()).toBe(200);

  const robotsMeta = page.locator('meta[name="robots"]');
  await expect(robotsMeta).toHaveAttribute('content', /noindex/i);

  const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(scripts.length).toBeGreaterThanOrEqual(2);

  const parsed = scripts.map((raw) => JSON.parse(raw) as Record<string, unknown>);
  const bookLd = parsed.find((node) => node['@type'] === 'Book');
  const breadcrumbLd = parsed.find((node) => node['@type'] === 'BreadcrumbList');

  expect(bookLd).toBeDefined();
  expect(bookLd?.['@context']).toBe('https://schema.org');
  expect(bookLd?.name).toBe(messages.devBook.fixtures.bookTitle);
  expect(bookLd?.inLanguage).toBe('ar');
  expect(bookLd).not.toHaveProperty('aggregateRating');
  expect(bookLd).not.toHaveProperty('review');
  expect(bookLd?.offers).toMatchObject({
    '@type': 'Offer',
    price: 135,
    priceCurrency: 'EGP',
    availability: 'https://schema.org/InStock',
  });

  expect(breadcrumbLd).toBeDefined();
  expect(Array.isArray(breadcrumbLd?.itemListElement)).toBe(true);

  const outOfStockResponse = await page.goto('/dev/book?state=out-of-stock');
  expect(outOfStockResponse?.status()).toBe(200);

  const outOfStockScripts = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents();
  const outOfStockBook = outOfStockScripts
    .map((raw) => JSON.parse(raw) as Record<string, unknown>)
    .find((node) => node['@type'] === 'Book');

  expect(outOfStockBook?.offers).toMatchObject({
    '@type': 'Offer',
    availability: 'https://schema.org/OutOfStock',
  });
});
