import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import messages from '../src/i18n/messages/ar.json';
import {
  isRealApiEnabled,
  realApiSkipReason,
  startRealApi,
  stopRealApi,
  webOrigin,
} from './support/real-api-server';

const countH1 = (html: string) => (html.match(/<h1[\s>]/g) ?? []).length;

// These assertions read the RAW server HTML (what crawlers get), not the hydrated DOM.
const rejectedPaths = ['/books/a%2Fb', '/books/a%5Cb', '/books/%E0%A4%A'];

for (const path of rejectedPaths) {
  test(`rejected slug ${path} returns 404 with the Arabic RTL page in the raw HTML`, async ({
    page,
    request,
  }) => {
    const response = await request.get(path);
    expect(response.status()).toBe(404);
    expect(response.headers()['content-type']).toContain('text/html');

    const html = await response.text();
    expect(html).not.toContain('__next_error__');
    expect(html).toMatch(/<html[^>]*\blang="ar"/);
    expect(html).toMatch(/<html[^>]*\bdir="rtl"/);
    expect(countH1(html)).toBe(1);
    expect(html).toContain(messages.site.footer.notFoundTitle);

    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
}

// "A real book page has exactly one <h1>" needs a real API, so it lives in real-seo.spec.ts (gated by E2E_REAL_API=1,
// spawning its own API). Apart from the gated "unknown book slug (real API)" group below, nothing in this file may need an API.

// The unknown-book 404 needs the real API: the page asks the API for the book and turns "not found" into notFound().
// Without an API the page answers 500 (the fetch fails), so the 404 assertion below would "fail as expected" for the
// WRONG reason and test.fail would report a pass. The two tests are therefore gated by E2E_REAL_API=1, like
// real-seo.spec.ts and book-layout.spec.ts, and run against the dev server that points at the spec's own API.
test.describe('unknown book slug (real API)', () => {
  test.skip(!isRealApiEnabled, realApiSkipReason);
  test.describe.configure({ mode: 'serial' });
  test.use({ baseURL: webOrigin });

  test.beforeAll(async ({}, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop-1280',
      'the viewport does not matter for raw HTML',
    );
    test.setTimeout(300_000);
    await startRealApi();
  });

  test.afterAll(() => {
    stopRealApi();
  });

  // Not an expected failure: it pins what the accepted defect still gets right (404 and HTML). If the API is down the
  // page answers 500 and THIS test fails visibly, so the expected failure below can never hide an outage.
  test('an unknown book slug answers 404 with an HTML page', async ({ request }) => {
    const response = await request.get('/books/zz-no-such-book');
    expect(response.status()).toBe(404);
    expect(response.headers()['content-type']).toContain('text/html');
  });

  test('the 404 of an unknown book slug has exactly one <h1> in the raw HTML', async ({
    request,
  }) => {
    // KNOWN DEFECT (open task): with Next 16.4.2 a notFound() thrown by any routed page is answered with the client-rendered
    // `__next_error__` shell (404 status and noindex are right, but the raw HTML has no <h1> and no dir="rtl").
    // test.fail: when the defect is fixed this test passes, Playwright reports "expected to fail but passed" and the
    // maintainer removes the line below.
    test.fail(
      true,
      'notFound() from a routed page returns the empty __next_error__ shell in the raw HTML',
    );

    const response = await request.get('/books/zz-no-such-book');
    expect(response.status()).toBe(404);
    const html = await response.text();
    expect(html).toMatch(/<html[^>]*dir="rtl"/);
    expect(countH1(html)).toBe(1);
  });
});

// /books keeps its loading skeleton (streamed before the real catalog, so its raw HTML carries the skeleton's <h1> too).
test('/books still ships its loading skeleton', async ({ request }) => {
  const response = await request.get('/books');
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain('aria-busy="true"');
  expect(countH1(html)).toBeGreaterThanOrEqual(1);
});
