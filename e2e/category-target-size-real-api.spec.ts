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

// Task 81: the breadcrumb links on a REAL category page pass the 24px target-size audit. Like the titles spec, it starts
// its own isolated API (no customer credentials needed).
test.skip(!isRealApiEnabled, realApiSkipReason);
test.describe.configure({ mode: 'default' });
test.use({ baseURL: webOrigin });

let slug: string | undefined;

test.beforeAll(async () => {
  test.setTimeout(300_000);
  await startRealApi();
  const categories = (await (await fetch(`${apiOrigin}/api/v1/categories`)).json()) as {
    slug: string;
  }[];
  slug = categories[0]?.slug;
});

test.afterAll(() => {
  stopRealApi();
});

test('a real category page passes the target-size audit', async ({ page }) => {
  expect(slug, 'the API has no category').toBeTruthy();
  await page.goto(`/categories/${encodeURIComponent(slug ?? '')}`);
  await expect(page.locator('h1').first()).toBeVisible();
  const links = page.locator('nav ol a');
  await expect(links.first()).toBeVisible();
  for (const height of await links.evaluateAll((nodes) =>
    nodes.map((node) => node.getBoundingClientRect().height),
  )) {
    expect(height).toBeGreaterThanOrEqual(24);
  }
  const results = await new AxeBuilder({ page }).withRules(['target-size']).analyze();
  expect(results.violations.map((v) => v.nodes.map((n) => n.target.join(' ')))).toEqual([]);
});
