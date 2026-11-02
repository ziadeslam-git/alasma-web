import path from 'node:path';

import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import messages from '../src/i18n/messages/ar.json';

// Dev-only home reference page (/dev/home returns 404 in production, so this runs against the next dev
// server on port 3101). Checks layout, RTL, single h1, no horizontal overflow, axe, and saves visual QA screenshots.
test.use({ baseURL: 'http://localhost:3101' });

test('/dev/home mobile menu opens and closes with the keyboard', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) > 1000, 'The desktop header has no mobile menu');
  await page.goto('/dev/home?state=ok');
  const trigger = page.getByRole('button', { name: messages.site.header.menu, exact: true });
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: messages.site.header.menu })).toBeVisible();
  const dialog = page.getByRole('dialog', { name: messages.site.header.menu });
  for (let step = 0; step < 12; step += 1) {
    await page.keyboard.press('Tab');
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
    expect(
      await page.evaluate(() => document.activeElement?.closest('[data-feature]') === null),
    ).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});

test('/dev/home header and hero remain readable at each viewport', async ({ page }, testInfo) => {
  await page.goto('/dev/home?state=ok');
  const header = page.locator('header').first();
  await expect(header).toBeVisible();
  const headerBox = await header.boundingBox();
  expect(headerBox).not.toBeNull();
  expect(headerBox!.height).toBeLessThanOrEqual(page.viewportSize()!.width <= 1000 ? 61 : 69);

  const layout = await page.evaluate(() => {
    const header = document.querySelector('header');
    const labels = Array.from(
      header?.querySelectorAll('nav a, nav [data-feature] > :first-child') ?? [],
    );
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };
    const clippedLabels = labels.filter((element) => {
      if (!visible(element) || !(element instanceof HTMLElement)) return false;
      return element.scrollWidth > element.clientWidth;
    }).length;
    const wrappers = Array.from(
      document.querySelectorAll(
        'header nav [data-feature], main [data-feature="publish-packages"]',
      ),
    );
    const overlaps = wrappers.filter((wrapper) => {
      const label = wrapper.firstElementChild;
      const badge = wrapper.querySelector('[data-soon-badge]');
      if (!label || !badge || !visible(label) || !visible(badge)) return false;
      const a = label.getBoundingClientRect();
      const b = badge.getBoundingClientRect();
      return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    }).length;
    const wrappedButtons = Array.from(
      header?.querySelectorAll('a[href="/login"], a[href="/register"]') ?? [],
    ).filter((element) => {
      if (!visible(element)) return false;
      const range = document.createRange();
      range.selectNodeContents(element);
      return range.getClientRects().length > 1;
    }).length;
    return {
      clippedLabels,
      overlaps,
      wrappedButtons,
      overflow: document.documentElement.scrollWidth > innerWidth,
    };
  });
  expect(layout).toEqual({ clippedLabels: 0, overlaps: 0, wrappedButtons: 0, overflow: false });
  await page.screenshot({
    fullPage: true,
    path: path.join('test-results', 'header-visual', `${testInfo.project.name}.png`),
  });
});

test('/dev/home renders populated state, has no horizontal overflow, passes axe, and saves screenshot', async ({
  page,
}, testInfo) => {
  const response = await page.goto('/dev/home?state=ok');

  expect(response?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('h1')).toHaveCount(1);
  expect(await page.locator('a[href^="/categories/"]').count()).toBeGreaterThan(0);

  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > globalThis.innerWidth,
  );
  expect(hasOverflow).toBe(false);

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);

  await page.screenshot({
    fullPage: true,
    path: path.join('test-results', 'home-visual', `${testInfo.project.name}.png`),
  });
});

test('/dev/home renders empty and error states without horizontal overflow', async ({ page }) => {
  const emptyResponse = await page.goto('/dev/home?state=empty');
  expect(emptyResponse?.status()).toBe(200);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByText(messages.home.categories.emptyTitle)).toBeVisible();
  await expect(page.getByText(messages.home.newArrivals.emptyTitle)).toBeVisible();
  await expect(page.getByText(messages.home.featured.emptyTitle)).toBeVisible();

  const emptyOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > globalThis.innerWidth,
  );
  expect(emptyOverflow).toBe(false);

  const errorResponse = await page.goto('/dev/home?state=error');
  expect(errorResponse?.status()).toBe(200);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByText(messages.home.categories.emptyTitle)).toBeVisible();
  await expect(page.getByText(messages.home.newArrivals.emptyTitle)).toBeVisible();
  await expect(page.getByText(messages.home.featured.emptyTitle)).toBeVisible();

  const errorOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > globalThis.innerWidth,
  );
  expect(errorOverflow).toBe(false);
});
