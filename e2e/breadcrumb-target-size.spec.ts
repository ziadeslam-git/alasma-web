import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.use({ baseURL: 'http://localhost:3101' });

// Task 81: breadcrumb links were ~21px tall, under the 24px WCAG 2.2 target size, and the category page failed the audit.
test('breadcrumb links are at least 24px tall and pass the target-size audit', async ({ page }) => {
  await page.goto('/dev/components');
  const links = page.locator('nav ol a');
  await expect(links.first()).toBeVisible();
  for (const box of await links.evaluateAll((nodes) =>
    nodes.map((node) => node.getBoundingClientRect().height),
  )) {
    expect(box).toBeGreaterThanOrEqual(24);
  }
  const results = await new AxeBuilder({ page }).withRules(['target-size']).analyze();
  expect(results.violations).toEqual([]);
});
