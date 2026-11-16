import AxeBuilder from '@axe-core/playwright';
import { expect, test, type APIRequestContext } from '@playwright/test';

import {
  apiOrigin,
  isRealApiEnabled,
  realApiSkipReason,
  startRealApi,
  stopRealApi,
  webOrigin,
} from './support/real-api-server';

// Opt-in real-API spec (same convention as book-layout.spec.ts): the home page and the search suggestions need real
// books, so the file is gated by E2E_REAL_API=1 and starts its own API.
test.skip(!isRealApiEnabled, realApiSkipReason);
test.describe.configure({ mode: 'serial' });
test.use({ baseURL: webOrigin });

const widths = [360, 768, 1280, 1920] as const;

// The search term comes from a book the API really has (its full title), never a fixed word: a fixed word ("كتاب")
// found nothing once the dev database held no title with it, and the "all results" button never appeared (Task 72).
async function searchTermFromApi(request: APIRequestContext) {
  const response = await request.get(`${apiOrigin}/api/v1/books`, { timeout: 15_000 });
  expect(response.ok()).toBe(true);
  const title = ((await response.json()) as { items: { title: string }[] }).items[0]?.title;
  expect(title, 'the API returns at least one book').toBeTruthy();
  return title!;
}

test.beforeAll(async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1280', 'the widths are set in the test itself');
  test.setTimeout(300_000);
  await startRealApi();
});

test.afterAll(() => {
  stopRealApi();
});

for (const width of widths) {
  test(`home, header, footer and search at ${width}px: one-line header, five-card shelves, styled search dialog, axe clean`, async ({
    page,
    request,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1280', 'the widths are set in the test itself');
    await page.setViewportSize({ width, height: 900 });
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth > globalThis.innerWidth),
    ).toBe(false);

    // header: one line on wide screens, no bell and no language switch, a round search button on small ones
    const header = page.locator('header').first();
    expect((await header.boundingBox())!.height).toBeLessThanOrEqual(70);
    await expect(header.locator('[data-feature="notifications-center"]')).toHaveCount(0);
    await expect(header.locator('[data-feature="language-switch-en"]')).toHaveCount(0);
    const isSmall = width <= 1000;
    await expect(header.getByRole('button', { name: 'بحث' })).toBeVisible({ visible: isSmall });

    // shelves: at most one row of five mini cards, nothing wider than the container
    const cardCounts = await page
      .locator('section[aria-labelledby="home-new-arrivals-heading"] a[href^="/books/"]')
      .count();
    expect(cardCounts).toBeLessThanOrEqual(5);

    // the cover is the mini card too: each image fills its 2:3 box
    const shelfImages = page.locator('section[aria-labelledby^="home-"] a[href^="/books/"] img');
    for (let index = 0; index < (await shelfImages.count()); index += 1) {
      // below-the-fold images are lazy: bring each one into view before waiting for it
      await shelfImages.nth(index).scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          shelfImages.nth(index).evaluate((element: HTMLImageElement) => element.naturalWidth),
        )
        .toBeGreaterThan(0);
    }
    // every shelf cover fills its 2:3 box, whether it is an image or the designed fallback: measuring images only found
    // nothing to measure when the shelf books had no cover image (Task 72)
    const shelfFills = await page
      .locator('section[aria-labelledby^="home-"] a[href^="/books/"]')
      .evaluateAll((links) =>
        links.map((link) => {
          const box = link.firstElementChild as HTMLElement;
          const media = (box.querySelector('img') ?? box.lastElementChild) as HTMLElement;
          const a = media.getBoundingClientRect();
          const b = box.getBoundingClientRect();
          return {
            dx: Math.abs(a.width - b.width),
            dy: Math.abs(a.height - b.height),
            ratio: b.height / b.width,
          };
        }),
      );
    expect(shelfFills.length).toBeGreaterThan(0);
    for (const fill of shelfFills) {
      expect(fill.dx).toBeLessThan(1);
      expect(fill.dy).toBeLessThan(1);
      expect(Math.abs(fill.ratio - 1.5)).toBeLessThan(0.02);
    }

    // phone tab bar: it never covers the last line of the page (the footer keeps room for it)
    if (width <= 760) {
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      const bar = await page.locator('nav[class*="appBar"]').boundingBox();
      const last = await page.locator('footer').locator('span').last().boundingBox();
      expect(bar).not.toBeNull();
      expect(last!.y + last!.height).toBeLessThanOrEqual(bar!.y);
      await page.evaluate(() => window.scrollTo(0, 0));
    }

    // footer: four columns on wide screens (brand, explore, help, newsletter)
    const footerSections = page.locator('footer section');
    await expect(footerSections).toHaveCount(4);
    if (width >= 1280) {
      const xs = await footerSections.evaluateAll((nodes) =>
        nodes.map((node) => Math.round(node.getBoundingClientRect().x)),
      );
      expect(new Set(xs).size).toBe(4);
    }

    await page.screenshot({
      path: `test-results/task56-57-visual/B-after-spec-home-${width}.png`,
      fullPage: true,
    });
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

    // search dialog: opens from the field (wide) or the round button (small); the "all results" button is styled
    const trigger = isSmall
      ? header.getByRole('button', { name: 'بحث' })
      : header.getByRole('searchbox');
    await trigger.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('combobox').fill(await searchTermFromApi(request));
    const all = dialog.getByRole('button', { name: 'عرض كل النتائج' });
    await expect(all).toBeVisible({ timeout: 15_000 });
    const style = await all.evaluate((element) => {
      const computed = getComputedStyle(element);
      return { background: computed.backgroundColor, radius: computed.borderRadius };
    });
    // not the browser default (transparent/grey button): the design's dark green pill
    expect(style.background).not.toBe('rgba(0, 0, 0, 0)');
    expect(style.background).not.toBe('rgb(239, 239, 239)');
    expect(parseFloat(style.radius)).toBeGreaterThan(20);
    await page.screenshot({
      path: `test-results/task56-57-visual/B-after-spec-search-${width}.png`,
    });
    expect((await new AxeBuilder({ page }).include('dialog[open]').analyze()).violations).toEqual(
      [],
    );
  });
}

for (const width of [360, 1280] as const) {
  test(`search dialog at ${width}px: a result row opens the book, "all results" opens the results page`, async ({
    page,
    request,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1280', 'the widths are set in the test itself');
    const term = await searchTermFromApi(request);
    await page.setViewportSize({ width, height: 900 });

    const open = async () => {
      await page.goto('/');
      const header = page.locator('header').first();
      await (
        width <= 1000 ? header.getByRole('button', { name: 'بحث' }) : header.getByRole('searchbox')
      ).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('combobox').fill(term);
      return dialog;
    };

    let dialog = await open();
    await expect(dialog.getByRole('option').first()).toBeVisible({ timeout: 15_000 });
    await dialog.getByRole('option').first().click();
    await expect(page).toHaveURL(/\/books\/[^/?]+$/);

    dialog = await open();
    await expect(dialog.getByRole('option').first()).toBeVisible({ timeout: 15_000 });
    await dialog.getByRole('combobox').press('ArrowDown');
    await dialog.getByRole('combobox').press('Enter');
    await expect(page).toHaveURL(/\/books\/[^/?]+$/);

    dialog = await open();
    await dialog.getByRole('button', { name: 'عرض كل النتائج' }).click();
    await expect(page).toHaveURL(/\/books\?q=/);
  });
}
