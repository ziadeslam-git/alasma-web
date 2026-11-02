import { expect, test } from '@playwright/test';

test('/books/[slug] returns 404 for slugs exceeding MAX_BOOK_SLUG_LENGTH (350 chars)', async ({
  page,
}) => {
  const overlongSlug = 'a'.repeat(351);
  const response = await page.goto(`/books/${overlongSlug}`);

  expect(response?.status()).toBe(404);

  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > globalThis.innerWidth,
  );
  expect(hasOverflow).toBe(false);
});

test('/books/[slug] rejects malformed percent-encoding without crashing', async ({ page }) => {
  const response = await page.goto('/books/%E0%A4%A');

  expect([400, 404]).toContain(response?.status());

  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > globalThis.innerWidth,
  );
  expect(hasOverflow).toBe(false);
});

test('/books/[slug] rejects an encoded slash', async ({ page }) => {
  const response = await page.goto('/books/a%2Fb');
  expect(response?.status()).toBe(404);
});
