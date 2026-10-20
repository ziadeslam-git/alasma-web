import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

import messages from '../src/i18n/messages/ar.json';

// Real-browser proof of the Modal and Drawer behaviour that jsdom cannot show. The dev-only /dev/components page is
// served by `next dev` (port 3101): it returns 404 in a production build.
test.use({ baseURL: 'http://localhost:3101' });

const modal = messages.devComponents.modal;
const drawer = messages.devComponents.drawer;
const modalTitle = `${modal.title} (${modal.sizes.md})`;

const trigger = (page: Page, name: string) => page.getByRole('button', { exact: true, name });
const openModal = async (page: Page) => {
  await trigger(page, modal.sizes.md).click();
  const dialog = page.getByRole('dialog', { name: modalTitle });
  await expect(dialog).toBeVisible();

  return dialog;
};

const isFocusInside = (dialog: Locator) =>
  dialog.evaluate((element) => element.contains(document.activeElement));

test.beforeEach(async ({ page }) => {
  await page.goto('/dev/components');
  await expect(trigger(page, modal.sizes.md)).toBeVisible();
});

test.describe('Modal', () => {
  test('moves focus inside on open, to the element marked as initial focus', async ({ page }) => {
    const dialog = await openModal(page);

    expect(await isFocusInside(dialog)).toBe(true);
    await expect(dialog.getByRole('textbox')).toBeFocused();
  });

  test('Tab and Shift+Tab cycle inside and never reach the page behind', async ({ page }) => {
    const dialog = await openModal(page);

    for (let step = 0; step < 8; step += 1) {
      await page.keyboard.press('Tab');
      expect(await isFocusInside(dialog)).toBe(true);
    }

    for (let step = 0; step < 8; step += 1) {
      await page.keyboard.press('Shift+Tab');
      expect(await isFocusInside(dialog)).toBe(true);
    }
  });

  test('the page behind cannot be reached or clicked while open', async ({ page }) => {
    const dialog = await openModal(page);
    const background = trigger(page, modal.sizes.sm);
    const box = await background.boundingBox();

    // the background button is still in the page but inert: the point where it sits belongs to the backdrop
    if (box) {
      const hitDialog = await page.evaluate(
        ({ x, y }) => document.elementFromPoint(x, y)?.closest('dialog') !== null,
        { x: box.x + box.width / 2, y: box.y + box.height / 2 },
      );
      expect(hitDialog).toBe(true);
    }

    // an inert element cannot take focus, even from a script
    const tookFocus = await background.evaluate((element) => {
      element.focus();

      return document.activeElement === element;
    });
    expect(tookFocus).toBe(false);
    await expect(dialog).toBeVisible();
  });

  test('Escape closes it and focus returns to the button that opened it', async ({ page }) => {
    const opener = trigger(page, modal.sizes.md);
    await openModal(page);

    await page.keyboard.press('Escape');

    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(opener).toBeFocused();
  });

  test('a click on the backdrop closes it', async ({ page }) => {
    await openModal(page);

    await page.mouse.click(2, 2);

    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('a blocking dialog ignores Escape (pressed twice) and the backdrop', async ({ page }) => {
    await trigger(page, modal.blocking.open).click();
    const dialog = page.getByRole('dialog', { name: modal.blocking.title });
    await expect(dialog).toBeVisible();

    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await page.mouse.click(2, 2);
    await page.waitForTimeout(400);

    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: modal.blocking.done }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('an alertdialog has the alertdialog role', async ({ page }) => {
    await trigger(page, modal.alert.open).click();

    await expect(page.getByRole('alertdialog', { name: modal.alert.title })).toBeVisible();
  });

  test('long content scrolls inside and the backdrop uses the overlay token', async ({ page }) => {
    await trigger(page, modal.long.open).click();
    const dialog = page.getByRole('dialog', { name: modal.long.title });
    await expect(dialog).toBeVisible();

    const box = await dialog.boundingBox();
    const viewport = page.viewportSize();
    const backdrop = await dialog.evaluate(
      (element) => getComputedStyle(element, '::backdrop').backgroundColor,
    );

    expect(box && viewport && box.height <= viewport.height).toBe(true);
    expect(backdrop).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('has no accessibility violations with the modal open', async ({ page }) => {
    await openModal(page);

    const results = await new AxeBuilder({ page })
      .exclude('nextjs-portal')
      .disableRules(['page-has-heading-one'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});

test.describe('scroll lock', () => {
  test('the page does not scroll behind, nothing jumps, and the position is restored', async ({
    page,
  }) => {
    const trigger600 = trigger(page, modal.sizes.md);
    await trigger600.scrollIntoViewIfNeeded();
    const before = await page.evaluate(() => ({
      gutter: window.innerWidth - document.documentElement.clientWidth,
      heading: document.querySelector('h2')?.getBoundingClientRect().left ?? 0,
      y: window.scrollY,
    }));

    await trigger600.click();
    await expect(page.getByRole('dialog', { name: modalTitle })).toBeVisible();
    const opened = await page.evaluate(() => window.scrollY);
    await page.mouse.move(200, 300);
    await page.mouse.wheel(0, 800);
    await page.keyboard.press('PageDown');
    await page.waitForTimeout(200);
    const during = await page.evaluate(() => ({
      heading: document.querySelector('h2')?.getBoundingClientRect().left ?? 0,
      overflow: document.body.style.overflow,
      y: window.scrollY,
    }));
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    const after = await page.evaluate(() => ({
      overflow: document.body.style.overflow,
      padding: document.body.style.paddingInlineStart + document.body.style.paddingInlineEnd,
      y: window.scrollY,
    }));

    expect(before.y).toBeGreaterThan(0);
    expect(during.overflow).toBe('hidden');
    expect(during.y).toBe(opened);
    expect(Math.abs(during.heading - before.heading)).toBeLessThanOrEqual(1);
    expect(after).toEqual({ overflow: '', padding: '', y: opened });
    test
      .info()
      .annotations.push({ type: 'scrollbar-gutter-px', description: String(before.gutter) });
  });

  test('two stacked overlays release the lock only when the last one closes', async ({ page }) => {
    await trigger(page, drawer.start).click();
    const drawerDialog = page.getByRole('dialog', { name: drawer.startTitle });
    await expect(drawerDialog).toBeVisible();

    await drawerDialog.getByRole('button', { name: drawer.openNested }).click();
    const nested = page.getByRole('dialog', { name: modal.nested.title });
    await expect(nested).toBeVisible();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');

    await nested.getByRole('button', { name: modal.actions.confirm }).click();
    await expect(nested).toHaveCount(0);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  });
});

test.describe('Drawer', () => {
  test('opens from the inline-start edge, which is the right edge in RTL', async ({ page }) => {
    await trigger(page, drawer.start).click();
    const dialog = page.getByRole('dialog', { name: drawer.startTitle });
    await expect(dialog).toBeVisible();
    await page.waitForTimeout(600);

    const box = await dialog.boundingBox();
    const viewport = page.viewportSize();

    expect(await page.evaluate(() => document.documentElement.dir)).toBe('rtl');
    expect(box && viewport && Math.abs(box.x + box.width - viewport.width) <= 1).toBe(true);
    expect(box && box.width <= 360).toBe(true);
  });

  test('opens from the inline-end edge, which is the left edge in RTL', async ({ page }) => {
    await trigger(page, drawer.end).click();
    const dialog = page.getByRole('dialog', { name: drawer.endTitle });
    await expect(dialog).toBeVisible();
    await page.waitForTimeout(600);

    const box = await dialog.boundingBox();

    expect(box && Math.abs(box.x) <= 1).toBe(true);
  });

  test('traps focus, closes on Escape and returns focus', async ({ page }) => {
    const opener = trigger(page, drawer.start);
    await opener.click();
    const dialog = page.getByRole('dialog', { name: drawer.startTitle });
    await expect(dialog).toBeVisible();

    for (let step = 0; step < 6; step += 1) {
      await page.keyboard.press('Tab');
      expect(await isFocusInside(dialog)).toBe(true);
    }

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(opener).toBeFocused();
  });

  test('has no accessibility violations with the drawer open', async ({ page }) => {
    await trigger(page, drawer.end).click();
    await expect(page.getByRole('dialog', { name: drawer.endTitle })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .exclude('nextjs-portal')
      .disableRules(['page-has-heading-one'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});

test.describe('reduced motion', () => {
  test('has no animation and leaves without an exit delay', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const dialog = await openModal(page);

    expect(await dialog.evaluate((element) => getComputedStyle(element).animationName)).toBe(
      'none',
    );

    await page.keyboard.press('Escape');

    await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 150 });
  });
});
