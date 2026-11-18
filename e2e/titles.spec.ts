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

// Task 79, part A: the page title is "<page title> | <site name>" (the root title template adds the site name), so a page
// title that already contains the site name made it appear twice ("<site> | الرئيسية | <site>"). Every route's <title>
// must contain the site name exactly once. E2E_CAPTURE_DIR, when set, also gets a titles-<label>.json of every title seen.
const siteName = messages.seo.siteName;
const occurrences = (title: string) => title.split(siteName).length - 1;
const seen: Record<string, string> = {};

test.afterAll(() => {
  const dir = process.env.E2E_CAPTURE_DIR;
  if (!dir || Object.keys(seen).length === 0) return;
  const label = process.env.E2E_TITLES_LABEL ?? 'run';
  writeFileSync(
    path.join(dir, `titles-${label}-${Date.now()}.json`),
    JSON.stringify(seen, null, 2),
  );
});

const staticRoutes = [
  '/',
  '/books',
  '/authors',
  '/categories',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/confirm-email',
  '/cart',
  '/zz-no-such-page',
] as const;

// Task 81: each auth page has its own title, page name first. The site name is not repeated here: the root template adds it.
const authTitles: Record<string, string> = {
  '/login': messages.seo.loginTitle,
  '/register': messages.seo.registerTitle,
  '/confirm-email': messages.seo.confirmEmailTitle,
  '/forgot-password': messages.seo.forgotPasswordTitle,
  '/reset-password': messages.seo.resetPasswordTitle,
};

test('the five auth pages have distinct titles, page name first', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1280', 'the title does not depend on the viewport');
  const titles: string[] = [];
  for (const [route, name] of Object.entries(authTitles)) {
    await page.goto(route);
    const title = await page.title();
    expect(title, route).toBe(`${name} | ${siteName}`);
    titles.push(title);
  }
  expect(new Set(titles).size).toBe(titles.length);
});

test.describe('without the API', () => {
  for (const route of staticRoutes) {
    test(`the site name appears exactly once in the title of ${route}`, async ({
      page,
    }, testInfo) => {
      test.skip(
        testInfo.project.name !== 'desktop-1280',
        'the title does not depend on the viewport',
      );
      await page.goto(route);
      const title = await page.title();
      seen[route] = title;
      expect(title.length).toBeGreaterThan(0);
      expect(occurrences(title), `title was: ${title}`).toBe(1);
    });
  }
});

test.describe('with the real API', () => {
  test.skip(!isRealApiEnabled, realApiSkipReason);
  test.describe.configure({ mode: 'default' });
  test.use({ baseURL: webOrigin });

  const dynamic: string[] = [];

  test.beforeAll(async ({}, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop-1280',
      'the title does not depend on the viewport',
    );
    test.setTimeout(300_000);
    await startRealApi();
    const json = async <T>(url: string) => (await (await fetch(`${apiOrigin}${url}`)).json()) as T;
    const book = (await json<{ items: { slug: string }[] }>('/api/v1/books?page=1&pageSize=1'))
      .items[0];
    const author = (await json<{ items: { slug: string }[] }>('/api/v1/authors?page=1&pageSize=1'))
      .items[0];
    const category = (await json<{ slug: string }[]>('/api/v1/categories'))[0];
    if (book) dynamic.push(`/books/${encodeURIComponent(book.slug)}`);
    if (author) dynamic.push(`/authors/${encodeURIComponent(author.slug)}`);
    if (category) dynamic.push(`/categories/${encodeURIComponent(category.slug)}`);
    for (const key of [
      'about',
      'contact',
      'privacy-policy',
      'terms',
      'shipping-policy',
      'return-policy',
      'payment-methods',
      'faq',
    ]) {
      dynamic.push(`/pages/${key}`);
    }
  });

  test.afterAll(() => {
    stopRealApi();
  });

  test('the site name appears exactly once in the title of every data-driven route', async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop-1280',
      'the title does not depend on the viewport',
    );
    expect(dynamic.length).toBeGreaterThan(8);
    const failures: string[] = [];
    for (const route of dynamic) {
      await page.goto(route);
      const title = await page.title();
      seen[route] = title;
      if (occurrences(title) !== 1) failures.push(`${route}: ${title}`);
    }
    expect(failures).toEqual([]);
  });
});
