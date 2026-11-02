import { expect, test } from '@playwright/test';
test('overlong author slug returns branded 404', async ({ page }) => {
  const response = await page.goto(`/authors/${'a'.repeat(201)}`);
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
test('malformed author slug is rejected', async ({ page }) => {
  const response = await page.goto('/authors/%E0%A4%A');
  expect([400, 404]).toContain(response?.status());
  if (response?.status() === 404)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
