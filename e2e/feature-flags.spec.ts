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

  // Unbuilt features (such as publish-packages and wishlist-heart) remain inert with the soon badge
  const publishGate = page.locator('[data-feature="publish-packages"]').first();
  await expect(publishGate).toHaveAttribute('aria-disabled', 'true');
  await expect(publishGate).toHaveAttribute('inert', '');
  await expect(publishGate.locator('[data-soon-badge]')).toHaveText(messages.site.soon);
  expect(await publishGate.locator('a').count()).toBe(0);
});
