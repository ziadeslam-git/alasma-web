import { expect, test } from '@playwright/test';
import messages from '../src/i18n/messages/ar.json';

test('overlong category has branded 404', async ({ page }) => {
  const response = await page.goto(`/categories/${'a'.repeat(201)}`);
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole('heading', { level: 1, name: messages.site.footer.notFoundTitle }),
  ).toBeVisible();
});

test('malformed encoding is rejected', async ({ page }) => {
  const response = await page.goto('/categories/%E0%A4%A');
  expect([400, 404]).toContain(response?.status());
  if (response?.status() === 404)
    await expect(
      page.getByRole('heading', { level: 1, name: messages.site.footer.notFoundTitle }),
    ).toBeVisible();
});
