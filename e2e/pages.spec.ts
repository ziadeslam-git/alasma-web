import { expect, test } from '@playwright/test';

test('invalid page keys are rejected', async ({ page }) => {
  const response = await page.goto(`/pages/${'a'.repeat(51)}`);
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  const malformed = await page.goto('/pages/%E0%A4%A');
  expect([400, 404]).toContain(malformed?.status());
});
