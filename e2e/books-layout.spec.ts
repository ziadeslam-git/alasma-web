import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import {
  apiOrigin,
  isRealApiEnabled,
  realApiSkipReason,
  startRealApi,
  stopRealApi,
  webOrigin,
} from './support/real-api-server';

// Opt-in real-API spec (same convention as book-layout.spec.ts): the listing is rendered from real books, so the
// whole file is gated by E2E_REAL_API=1 and the spec starts its own API.
test.skip(!isRealApiEnabled, realApiSkipReason);
test.describe.configure({ mode: 'serial' });
test.use({ baseURL: webOrigin });

const widths = [360, 768, 1280, 1920] as const;
const MAX_CONTENT_WIDTH = 1280;

type ApiListItem = { title: string; coverImageUrl: string | null; discountPercent: number };

test.beforeAll(async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1280', 'the widths are set in the test itself');
  test.setTimeout(300_000);
  await startRealApi();
});

test.afterAll(() => {
  stopRealApi();
});

for (const width of widths) {
  test(`books listing at ${width}px: container, no overflow, full-bleed covers, hover actions, axe clean`, async ({
    page,
    request,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1280', 'the widths are set in the test itself');

    const list = await request.get(`${apiOrigin}/api/v1/books`, { timeout: 15_000 });
    expect(list.ok()).toBe(true);
    const items = ((await list.json()) as { items: ApiListItem[] }).items;
    expect(items.length).toBeGreaterThan(0);

    await page.setViewportSize({ width, height: 900 });
    const response = await page.goto('/books');
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth > globalThis.innerWidth),
    ).toBe(false);

    // the page content sits in the container
    const layoutWidth = await page.evaluate(() => document.documentElement.clientWidth);
    const gutter = width <= 1000 ? 16 : 32;
    const outerMargin = Math.max(0, (layoutWidth - MAX_CONTENT_WIDTH) / 2);
    const first = (await page.locator('article').first().boundingBox())!;
    expect(first.x).toBeGreaterThanOrEqual(outerMargin + gutter - 1);

    // two columns on small screens, four on wide ones
    const columns = await page.evaluate(
      () =>
        new Set(
          [...document.querySelectorAll('main article')].map((a) => a.getBoundingClientRect().x),
        ).size,
    );
    expect(columns).toBe(width <= 1000 ? 2 : 4);

    // the cover IS the card: every loaded image fills its 2:3 figure edge to edge (no inset, no white tile), and the
    // radius and shadow belong to the figure
    const images = page.locator('article img');
    const imageCount = await images.count();
    expect(imageCount).toBeGreaterThan(0);
    for (let index = 0; index < imageCount; index += 1) {
      // below-the-fold images are lazy: bring each one into view before waiting for it
      await images.nth(index).scrollIntoViewIfNeeded();
      await expect
        .poll(() => images.nth(index).evaluate((element: HTMLImageElement) => element.naturalWidth))
        .toBeGreaterThan(0);
    }
    const fills = await images.evaluateAll((elements) =>
      elements.map((element) => {
        const figure = element.closest('article')!.firstElementChild as HTMLElement;
        const a = element.getBoundingClientRect();
        const b = figure.getBoundingClientRect();
        const style = getComputedStyle(figure);
        return {
          dx: Math.abs(a.width - b.width),
          dy: Math.abs(a.height - b.height),
          ratio: b.height / b.width,
          radius: parseFloat(style.borderTopLeftRadius),
          shadow: style.boxShadow,
        };
      }),
    );
    for (const fill of fills) {
      expect(fill.dx).toBeLessThan(1);
      expect(fill.dy).toBeLessThan(1);
      expect(Math.abs(fill.ratio - 1.5)).toBeLessThan(0.02);
      expect(fill.radius).toBeGreaterThan(0);
      expect(fill.shadow).not.toBe('none');
    }

    // the action pill is hidden until hover (pointer devices), then shows add-to-cart
    const card = page.locator('article').first();
    const pill = card.locator('[class*="actions"]');
    await card.hover();
    await expect
      .poll(() => pill.evaluate((element) => getComputedStyle(element).opacity))
      .toBe('1');
    await expect(pill.getByRole('button').first()).toBeVisible();

    // nothing the API does not return
    const text = (await page.locator('main article').allInnerTexts()).join(' ');
    for (const invented of ['الأكثر مبيعاً', '4.8', '248']) {
      expect(text).not.toContain(invented);
    }

    await page.screenshot({
      path: `test-results/task56-57-visual/A-after-spec-${width}.png`,
      fullPage: true,
    });
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
}
