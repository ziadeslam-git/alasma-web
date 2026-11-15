import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import messages from '../src/i18n/messages/ar.json';

// Same default as the app (AGENTS.md: API_ORIGIN defaults to http://127.0.0.1:5198).
const apiOrigin = process.env.API_ORIGIN ?? 'http://127.0.0.1:5198';

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

test('a real book page has exactly one <h1> in the raw HTML', async ({ request }) => {
  const list = await request.get(`${apiOrigin}/api/v1/books`, { timeout: 15_000 });
  expect(list.ok()).toBe(true);
  const { items } = (await list.json()) as { items: { slug: string }[] };
  const slug = items[0]?.slug;
  expect(slug).toBeTruthy();

  const response = await request.get(`/books/${slug}`);
  expect(response.status()).toBe(200);
  expect(countH1(await response.text())).toBe(1);
});

test('the 404 of an unknown book slug has exactly one <h1> in the raw HTML', async ({
  request,
}) => {
  // KNOWN DEFECT (open task): with Next 16.4.2 a notFound() thrown by any routed page is answered with the client-rendered
  // `__next_error__` shell (404 status and noindex are right, but the raw HTML has no <h1>). Remove this line once fixed.
  test.fail(
    true,
    'notFound() from a routed page returns the empty __next_error__ shell in the raw HTML',
  );

  const response = await request.get('/books/zz-no-such-book');
  expect(response.status()).toBe(404);
  const html = await response.text();
  expect(html).toMatch(/<html[^>]*\bdir="rtl"/);
  expect(countH1(html)).toBe(1);
});

// /books keeps its loading skeleton (streamed before the real catalog, so its raw HTML carries the skeleton's <h1> too).
test('/books still ships its loading skeleton', async ({ request }) => {
  const response = await request.get('/books');
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain('aria-busy="true"');
  expect(countH1(html)).toBeGreaterThanOrEqual(1);
});
