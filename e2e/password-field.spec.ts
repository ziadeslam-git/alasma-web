import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import messages from '../src/i18n/messages/ar.json';

// Show/hide button and live checklist on the password fields. Runs on the 3 viewports with no API behind the pages:
// every /api/v1 request is aborted, and nothing is submitted.
const text = messages.auth;

const pages = [
  {
    name: 'register',
    path: '/register',
    fields: ['password', 'confirmPassword'],
    hasChecklist: true,
  },
  { name: 'login', path: '/login', fields: ['password'], hasChecklist: false },
  {
    name: 'reset-password',
    path: '/reset-password?userId=1&token=fake-token',
    fields: ['password', 'confirmPassword'],
    hasChecklist: true,
  },
] as const;

async function open(page: Page, path: string) {
  await page.route('**/api/v1/**', (route) => route.abort());
  await page.goto(path);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByRole('button', { name: text.showPassword }).first()).toBeEnabled();
}

for (const target of pages) {
  test.describe(target.name, () => {
    test('every password field has a working, accessible eye button at the inline end', async ({
      page,
    }) => {
      await open(page, target.path);

      await expect(page.getByRole('button', { name: text.showPassword })).toHaveCount(
        target.fields.length,
      );

      for (const name of target.fields) {
        const input = page.locator(`input[name="${name}"]`);
        const wrapper = input.locator('xpath=..');
        const toggle = wrapper.getByRole('button');

        await expect(toggle).toBeVisible();
        await expect(toggle).toHaveAttribute('aria-pressed', 'false');
        await expect(input).toHaveAttribute('type', 'password');

        // RTL: the inline end is the visual left, inside the field box and in its left half.
        const inputBox = (await input.boundingBox())!;
        const toggleBox = (await toggle.boundingBox())!;
        expect(toggleBox.x).toBeGreaterThanOrEqual(inputBox.x);
        expect(toggleBox.x + toggleBox.width).toBeLessThanOrEqual(inputBox.x + inputBox.width);
        expect(toggleBox.x + toggleBox.width / 2).toBeLessThan(inputBox.x + inputBox.width / 2);

        await input.fill('Abcdefgh1x');
        await toggle.click();
        await expect(input).toHaveAttribute('type', 'text');
        await expect(toggle).toHaveAttribute('aria-pressed', 'true');
        await expect(toggle).toHaveAccessibleName(text.hidePassword);
        await expect(input).toHaveValue('Abcdefgh1x');

        await toggle.press('Enter');
        await expect(input).toHaveAttribute('type', 'password');
        await expect(toggle).toHaveAccessibleName(text.showPassword);
      }

      // the button never submitted anything
      await expect(page).toHaveURL(new RegExp(`${target.path.split('?')[0]}$`));
      // (scoped to the form: Next's own route announcer is a role="alert" outside it)
      await expect(page.locator('form [role="alert"]')).toHaveCount(0);
    });

    test('has no horizontal overflow and no axe violations, hidden and visible', async ({
      page,
    }) => {
      await open(page, target.path);

      const hasOverflow = () =>
        page.evaluate(() => document.documentElement.scrollWidth > globalThis.innerWidth);

      expect(await hasOverflow()).toBe(false);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

      await page.locator('input[name="password"]').fill('Abc');
      // each click renames its button to "hide", so the first remaining "show" button is always the next one
      for (let index = 0; index < target.fields.length; index += 1) {
        await page.getByRole('button', { name: text.showPassword }).first().click();
      }
      await expect(page.getByRole('button', { name: text.hidePassword })).toHaveCount(
        target.fields.length,
      );

      expect(await hasOverflow()).toBe(false);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    });

    if (target.hasChecklist) {
      test('the checklist updates while typing, with one polite live summary', async ({ page }) => {
        await open(page, target.path);

        const password = page.locator('input[name="password"]');
        const summary = (met: number) => page.getByText(`استوفيت ${met} من 4 شروط`);

        await expect(page.getByText(text.passwordRulesTitle)).toBeVisible();
        // (scoped to the form: Next's route announcer is an aria-live region outside it)
        await expect(page.locator('form [aria-live]')).toHaveCount(1);
        await expect(page.locator('form [aria-live]')).toHaveAttribute('aria-live', 'polite');
        await expect(summary(0)).toBeVisible();

        await password.pressSequentially('a');
        await expect(summary(1)).toBeVisible();
        await password.pressSequentially('B');
        await expect(summary(2)).toBeVisible();
        await password.pressSequentially('7');
        await expect(summary(3)).toBeVisible();
        await password.pressSequentially('cdefghi');
        await expect(summary(4)).toBeVisible();

        const items = page.locator('li[data-met]');
        await expect(items).toHaveCount(4);
        await expect(page.locator('li[data-met="true"]')).toHaveCount(4);

        await password.fill('');
        await expect(summary(0)).toBeVisible();
        await expect(page.locator('li[data-met="true"]')).toHaveCount(0);
      });
    } else {
      test('has no checklist on the login form', async ({ page }) => {
        await open(page, target.path);

        await expect(page.getByText(text.passwordRulesTitle)).toHaveCount(0);
      });
    }
  });
}
