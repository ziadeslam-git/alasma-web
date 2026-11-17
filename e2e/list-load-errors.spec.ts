import { expect, test, type Page } from '@playwright/test';

import messages from '../src/i18n/messages/ar.json';
import {
  apiOrigin,
  isRealApiEnabled,
  realApiSkipReason,
  startRealApi,
  stopRealApi,
  webOrigin,
} from './support/real-api-server';

// Task 67: a list page whose API is down shows an error state with a retry (never "nothing here yet"), and the retry
// recovers once the API is back. The failure is real: the spec stops the API it spawned (the page fetches on the
// server, so a browser route abort could not reach it) and starts it again before pressing retry.
test.skip(!isRealApiEnabled, realApiSkipReason);
test.describe.configure({ mode: 'serial' });
test.use({ baseURL: webOrigin });

async function isApiUp() {
  try {
    return (await fetch(`${apiOrigin}/api/v1/sitemap`)).ok;
  } catch {
    return false;
  }
}

test.beforeAll(async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1280', 'one viewport is enough for the load states');
  test.setTimeout(300_000);
  await startRealApi();
});

test.afterAll(() => {
  stopRealApi();
});

const pages: { path: string; loaded: (page: Page) => ReturnType<Page['locator']> }[] = [
  {
    path: '/',
    loaded: (page) => page.locator('section[aria-labelledby^="home-"] a[href^="/books/"]').first(),
  },
  { path: '/authors', loaded: (page) => page.locator('main a[href^="/authors/"]').first() },
  { path: '/categories', loaded: (page) => page.locator('main a[href^="/categories/"]').first() },
  { path: '/books', loaded: (page) => page.locator('main a[href^="/books/"]').first() },
];

for (const { path, loaded } of pages) {
  test(`${path} shows a retryable error while the API is down, and recovers on retry`, async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop-1280',
      'one viewport is enough for the load states',
    );
    test.setTimeout(300_000);

    stopRealApi();
    await expect
      .poll(isApiUp, { message: 'the API this spec spawned must stop', timeout: 30_000 })
      .toBe(false);

    await page.goto(path);
    const retry = page.getByRole('main').getByRole(path === '/books' ? 'link' : 'button', {
      name: messages.site.loadError.retry,
    });
    await expect(retry.first()).toBeVisible();
    await expect(loaded(page)).toHaveCount(0);

    await startRealApi();
    await retry.first().click();
    await expect(loaded(page)).toBeVisible({ timeout: 30_000 });
  });
}
