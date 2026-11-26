import { expect, test } from '@playwright/test';

import messages from '../src/i18n/messages/ar.json';

test('visitor feature flags fall back cleanly when the API is unavailable and keep unbuilt features inert with the soon badge', async ({
  page,
}) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);

  // Built and locally live static-pages links in the footer remain live links on fallback
  const aboutLink = page
    .getByRole('contentinfo')
    .getByRole('link', { name: messages.site.footer.about });
  await expect(aboutLink).toHaveAttribute('href', '/pages/about');

  // Built features stay live links on fallback (publish-packages went live in Task 94)
  const publishLink = page
    .getByRole('contentinfo')
    .getByRole('link', { name: messages.site.header.publishPackages });
  await expect(publishLink).toHaveAttribute('href', '/publish');

  // Unbuilt features (such as the best-sellers period tabs) remain inert with the soon badge
  await page.goto('/bestsellers');
  const periodGate = page.locator('[data-feature="bestsellers-period"]').first();
  await expect(periodGate).toHaveAttribute('aria-disabled', 'true');
  await expect(periodGate).toHaveAttribute('inert', '');
  await expect(periodGate.locator('[data-soon-badge]')).toHaveText(messages.site.soon);
  expect(await periodGate.locator('a').count()).toBe(0);
});
