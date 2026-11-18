import AxeBuilder from '@axe-core/playwright';
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

// Opt-in real-API spec (the same convention as real-seo.spec.ts): every check needs a real book from the API, because
// the Next server renders the page from it, so the whole file is gated. Skipped unless E2E_REAL_API=1 (the reason is
// printed in the CI log); with it, the spec starts its own API on E2E_API_PORT and needs no externally started one.
test.skip(!isRealApiEnabled, realApiSkipReason);
test.describe.configure({ mode: 'serial' });
test.use({ baseURL: webOrigin });

const widths = [360, 390, 768, 1280, 1920] as const;
const MAX_CONTENT_WIDTH = 1280;

type ApiBook = {
  coverType: string | null;
  publishYear: number | null;
  ratingAverage: number | null;
  ratingCount: number;
  slug: string;
  title: string;
};

test.beforeAll(async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1280', 'the widths are set in the test itself');
  test.setTimeout(300_000);
  await startRealApi();
});

test.afterAll(() => {
  stopRealApi();
});

// Real book page against the real API, checked at the four design widths. The viewport is set inside the test, so one
// project is enough (the other two would repeat the same checks).
for (const width of widths) {
  test(`book details at ${width}px: container, no overflow, no invented values, never a blank cover, axe clean`, async ({
    page,
    request,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1280', 'the widths are set in the test itself');

    const list = await request.get(`${apiOrigin}/api/v1/books`, { timeout: 15_000 });
    expect(list.ok()).toBe(true);
    const slug = ((await list.json()) as { items: { slug: string }[] }).items[0]?.slug;
    expect(slug).toBeTruthy();
    const details = await request.get(`${apiOrigin}/api/v1/books/${slug}`, { timeout: 15_000 });
    const book = (await details.json()) as ApiBook;

    await page.setViewportSize({ width, height: 900 });
    const response = await page.goto(`/books/${slug}`);
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);

    // no horizontal overflow
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth > globalThis.innerWidth),
    ).toBe(false);

    // the content sits in a container: padded from the screen edge, and centred with a maximum width on wide screens
    const hero = page.locator('section[aria-labelledby="book-title"]');
    const box = (await hero.boundingBox())!;
    // (the layout width excludes the scrollbar, so it is read from the page, not taken from the viewport)
    const layoutWidth = await page.evaluate(() => document.documentElement.clientWidth);
    const gutter = width <= 1000 ? 16 : 32;
    const outerMargin = Math.max(0, (layoutWidth - MAX_CONTENT_WIDTH) / 2);
    expect(box.x).toBeGreaterThanOrEqual(outerMargin + gutter - 1);
    expect(box.x + box.width).toBeLessThanOrEqual(layoutWidth - outerMargin - gutter + 1);

    // only what the API returns: the year has no thousands separator, and nothing from the design sample data appears
    const text = await page.locator('main').innerText();
    if (book.publishYear) {
      expect(text).toContain(String(book.publishYear));
      expect(text).not.toMatch(/\d,\d{3}\s*$/m);
    }
    for (const invented of ['4.8', '2,400', 'نسخة إلكترونية', 'آراء القراء', 'يُشترى معها']) {
      expect(text).not.toContain(invented);
    }
    if (book.ratingCount === 0) {
      expect(text).not.toContain('تقييم');
    }

    // the cover is never a blank tile: a loaded image, or the designed cover with the title
    const cover = hero.locator('div').first();
    const image = cover.locator('img');
    if ((await image.count()) > 0) {
      await expect
        .poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth))
        .toBeGreaterThan(0);
    } else {
      await expect(cover).toContainText(book.title);
    }

    // Task 70: the frame is 2:3 and the cover (image or designed fallback) fills it edge to edge, with no inset
    const fill = await page.evaluate(() => {
      const frame = document.querySelector('[class*="coverFrame"]');
      const inner = frame?.firstElementChild;
      const media = inner?.querySelector('img') ?? inner;
      if (!frame || !media) return null;
      const f = frame.getBoundingClientRect();
      const m = media.getBoundingClientRect();
      return {
        ratio: f.width / f.height,
        dx: Math.abs(f.width - m.width),
        dy: Math.abs(f.height - m.height),
      };
    });
    expect(fill).not.toBeNull();
    expect(fill!.ratio).toBeCloseTo(2 / 3, 2);
    expect(fill!.dx).toBeLessThanOrEqual(1);
    expect(fill!.dy).toBeLessThanOrEqual(1);

    // Task 70: the soon actions are left out of the page, and add to cart still works
    for (const feature of [
      'buy-now',
      'wishlist-heart',
      'book-sample-pdf',
      'book-short-link',
      'book-report-error',
    ]) {
      await expect(hero.locator(`[data-feature="${feature}"]`)).toHaveCount(0);
    }
    await expect(
      page.locator(
        'main [data-feature="book-report-error"], main [data-feature="book-short-link"]',
      ),
    ).toHaveCount(0);
    await expect(page.getByText('خيارات إضافية')).toHaveCount(0);
    await expect(
      hero.getByRole('button', { name: messages.catalog.detail.actions.buyNow }),
    ).toHaveCount(0);
    const addToCart = hero.getByRole('button', { name: book.title });
    await expect(addToCart).toBeEnabled();
    // a visitor is sent to login with a return path (the cart needs a session); the button keeps that behaviour
    await addToCart.click();
    await expect(page).toHaveURL(/\/login\?next=/);

    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
}
