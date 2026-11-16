import { expect, test } from '@playwright/test';

// Task 71: the hero wave must cover the full width at every point of its drift loop, so no dark step shows at the
// physical left edge on a wide screen. The wave's box is read at the start, middle and end of the loop.
const widths = [360, 390, 1440, 1920, 2131, 2560] as const;

for (const width of widths) {
  test(`hero wave covers the hero edge to edge at ${width}px through the loop`, async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1280', 'the widths are set in the test itself');
    await page.setViewportSize({ width, height: 900 });
    expect((await page.goto('/'))?.status()).toBe(200);

    const wave = page.locator('svg[viewBox="0 0 2400 90"]');
    await expect(wave).toHaveCount(1);

    for (const time of [0, 9_000, 17_900]) {
      const gap = await wave.evaluate((element, currentTime) => {
        for (const animation of element.getAnimations()) {
          animation.pause();
          animation.currentTime = currentTime;
        }
        const hero = element.closest('section')!.getBoundingClientRect();
        const box = element.getBoundingClientRect();
        return { left: box.left - hero.left, right: hero.right - box.right };
      }, time);
      expect(gap.left).toBeLessThanOrEqual(0.5);
      expect(gap.right).toBeLessThanOrEqual(0.5);
    }
  });

  test(`hero wave covers the hero with reduced motion at ${width}px`, async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1280', 'the widths are set in the test itself');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const gap = await page.locator('svg[viewBox="0 0 2400 90"]').evaluate((element) => {
      const hero = element.closest('section')!.getBoundingClientRect();
      const box = element.getBoundingClientRect();
      return { left: box.left - hero.left, right: hero.right - box.right };
    });
    expect(gap.left).toBeLessThanOrEqual(0.5);
    expect(gap.right).toBeLessThanOrEqual(0.5);
  });
}
