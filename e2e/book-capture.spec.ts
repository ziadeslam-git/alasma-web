import path from 'node:path';

import { expect, test } from '@playwright/test';

import {
  apiOrigin,
  isRealApiEnabled,
  realApiSkipReason,
  startRealApi,
  stopRealApi,
  webOrigin,
} from './support/real-api-server';

// Visual capture only (Task 72/73 evidence): the book page against the real API, written to E2E_CAPTURE_DIR (a folder
// outside the repo, because Playwright wipes test-results/). Skipped unless E2E_REAL_API=1 AND E2E_CAPTURE_DIR is set;
// the API is spawned by the real-API helper, never by hand. It asserts only that the page rendered.
const captureDir = process.env.E2E_CAPTURE_DIR;

test.skip(!isRealApiEnabled, realApiSkipReason);
test.skip(!captureDir, 'Set E2E_CAPTURE_DIR to a folder outside the repo to capture screenshots.');
test.describe.configure({ mode: 'serial' });
test.use({ baseURL: webOrigin });

test.beforeAll(async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1280', 'the widths are set in the test itself');
  test.setTimeout(300_000);
  await startRealApi();
});

test.afterAll(() => {
  stopRealApi();
});

for (const width of [360, 1280, 1920] as const) {
  test(`capture the book page at ${width}px`, async ({ page, request }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1280', 'the widths are set in the test itself');
    const list = await request.get(`${apiOrigin}/api/v1/books`, { timeout: 15_000 });
    const slug = ((await list.json()) as { items: { slug: string }[] }).items[0]?.slug;
    expect(slug, 'the API returns at least one book').toBeTruthy();

    await page.setViewportSize({ width, height: 1000 });
    const response = await page.goto(`/books/${encodeURIComponent(slug!)}`);
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    await page.screenshot({ fullPage: true, path: path.join(captureDir!, `book-${width}.png`) });
  });
}
