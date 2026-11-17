import path from 'node:path';

import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.use({ baseURL: 'http://localhost:3101' });

for (const state of ['confirmed', 'unconfirmed', 'long']) {
  test(`account preview ${state} is accessible`, async ({ page }, testInfo) => {
    await page.goto(`/dev/account?state=${state}`);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.getByRole('main')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
      false,
    );
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.screenshot({
      fullPage: true,
      path: path.join('test-results', 'account-visual', `${state}-${testInfo.project.name}.png`),
    });
  });
}

// Task 73: every row keeps its value next to its label: one shared value column on wider screens (label beside
// value), the value under its label on phones. No orphan label, no soon entries in the menu.
for (const width of [360, 768, 1280] as const) {
  test(`account overview rows are aligned at ${width}px`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1280', 'the widths are set in the test itself');
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/dev/account?state=confirmed');

    const rows = await page.locator('main dl > div').evaluateAll((elements) =>
      elements.map((row) => {
        const label = row.querySelector('dt')!.getBoundingClientRect();
        const value = row.querySelector('dd')!.getBoundingClientRect();
        const text = row.querySelector('dd')!.textContent?.trim() ?? '';
        return {
          labelRight: label.right,
          valueRight: value.right,
          valueTop: value.top,
          labelTop: label.top,
          text,
        };
      }),
    );
    expect(rows).toHaveLength(3);
    for (const row of rows) expect(row.text).not.toBe('');
    const valueEdges = rows.map((row) => Math.round(row.valueRight));
    expect(new Set(valueEdges).size).toBe(1);
    for (const row of rows) {
      if (width <= 760) {
        // stacked: the value sits under its label, on the same (right, in RTL) edge
        expect(Math.abs(row.valueRight - row.labelRight)).toBeLessThanOrEqual(1);
        expect(row.valueTop).toBeGreaterThan(row.labelTop);
      } else {
        // beside: the value starts right after the label column, on the same line
        expect(row.valueRight).toBeLessThan(row.labelRight);
        expect(Math.abs(row.valueTop - row.labelTop)).toBeLessThanOrEqual(4);
      }
    }

    const navigation = page.getByRole('navigation', { name: /./ }).last();
    await expect(
      page.locator('main [data-soon-badge], nav [data-feature="wishlist-heart"]'),
    ).toHaveCount(0);
    await expect(page.locator('[data-feature="profile-edit"]')).toHaveCount(0);
    await expect(navigation).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
      false,
    );
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

    const captureDir = process.env.E2E_CAPTURE_DIR;
    if (captureDir) {
      await page.screenshot({
        fullPage: true,
        path: path.join(captureDir, `account-${width}.png`),
      });
    }
  });
}
