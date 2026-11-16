import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import {
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
    await dialog.getByRole('combobox').fill('كتاب');
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
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1280', 'the widths are set in the test itself');
    await page.setViewportSize({ width, height: 900 });

    const open = async () => {
      await page.goto('/');
      const header = page.locator('header').first();
      await (
        width <= 1000 ? header.getByRole('button', { name: 'بحث' }) : header.getByRole('searchbox')
      ).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('combobox').fill('كتاب');
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
