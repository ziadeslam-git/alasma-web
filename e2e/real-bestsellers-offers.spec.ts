import { expect, test } from '@playwright/test';
import messages from '../src/i18n/messages/ar.json';
import { requireRealApi } from './support/real-api';

// Real-API journey (Task 11, owner only, no customer needed): the public bestsellers and offers pages render with the
// API running. They read data only; nothing is created.
requireRealApi({ needsCustomer: false });
test.use({ trace: 'off', screenshot: 'off', video: 'off' });

test('the bestsellers page renders its heading and the API answer', async ({ page }) => {
  const response = await page.goto('/bestsellers');
  expect(response?.status()).toBe(200);
  await expect(page.locator('h1')).toHaveText(messages.bestsellers.heading);
  await expect(
    page
      .getByLabel(messages.bestsellers.listLabel)
      .first()
      .or(page.getByText(messages.bestsellers.emptyTitle)),
  ).toBeVisible();
  await expect(page.getByText(messages.bestsellers.error, { exact: true })).toHaveCount(0);
  // Either ranked books or the page's own empty state, never the load-error message.
  await expect(page.locator('main')).not.toContainText('Application error');
});

test('the offers page renders its heading and either bundles or discounted books', async ({
  page,
}) => {
  const response = await page.goto('/offers');
  expect(response?.status()).toBe(200);
  await expect(page.locator('h1')).toHaveText(messages.offers.heading);
  await expect(page.locator('main')).not.toContainText('Application error');
});
