import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import messages from '../src/i18n/messages/ar.json';
import {
  apiOrigin,
  isRealApiEnabled,
  realApiSkipReason,
  startRealApi,
  stopRealApi,
  webOrigin,
} from './support/real-api-server';

// Task 75: the site shell and the status pages. The first block needs no API (a URL that matches no route, the auth
// screens, the footer position, the guest drawer). The second block needs the real API: an unknown slug is a 404 only
// after the API answers 404, and the error page needs the API to be down. It starts its own API through the helper.
// E2E_SHELL_ORIGIN points the real-API block at another web server (a production build on its own port);
// E2E_CAPTURE_DIR, when set, also writes a screenshot per check (outside the repo: Playwright wipes test-results/).
const captureDir = process.env.E2E_CAPTURE_DIR;
const WIDTHS = [360, 768, 1280] as const;
const GUTTER = 16;

// Pictures only: mark the intro splash as already seen (it is a cookie), or it covers the first page of every session in a
// production build.
test.beforeEach(async ({ page }) => {
  if (captureDir) {
    await page.addInitScript(() => {
      document.cookie = 'alasma-splash-seen=1; Path=/; SameSite=Lax';
    });
  }
});

const countOf = (page: Page, selector: string) => page.locator(selector).count();

async function structure(page: Page) {
  return {
    headers: await countOf(page, 'header'),
    footers: await countOf(page, 'footer'),
    mains: await countOf(page, 'main'),
    h1: await countOf(page, 'h1'),
  };
}

async function shot(page: Page, name: string, width: number) {
  if (!captureDir) return;
  // the dev indicator would sit in the picture
  await page.addStyleTag({
    content: '[class*="splash-overlay"],nextjs-portal{display:none!important}',
  });
  await page.screenshot({ fullPage: true, path: path.join(captureDir, `${name}-${width}.png`) });
}

test.describe('shell without the API', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1280', 'the widths are set in the test itself');
  });

  for (const width of WIDTHS) {
    test(`a URL that matches no route: one header, footer, main and h1, with gutters (${width}px)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      const response = await page.goto('/zz-no-such-page');
      expect(response?.status()).toBe(404);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        messages.site.footer.notFoundTitle,
      );
      expect(await structure(page)).toEqual({ headers: 1, footers: 1, mains: 1, h1: 1 });

      // the card keeps a side gutter on a phone, like the other pages
      const card = await page.locator('main section').first().boundingBox();
      const viewport = await page.evaluate(() => document.documentElement.clientWidth);
      expect(card!.x).toBeGreaterThanOrEqual(GUTTER - 1);
      expect(card!.x + card!.width).toBeLessThanOrEqual(viewport - GUTTER + 1);
      await shot(page, 'noroute-404', width);
    });
  }

  for (const width of [768, 1280] as const) {
    // a tall viewport, so the 404 page (about 960px with its footer) is genuinely shorter than the screen
    test(`the footer sits at the bottom of a short page without adding scroll (${width}px)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 1400 });
      await page.goto('/zz-no-such-page');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const { footerBottom, scrollHeight, innerHeight } = await page.evaluate(() => ({
        footerBottom: document.querySelector('footer')!.getBoundingClientRect().bottom + scrollY,
        scrollHeight: document.documentElement.scrollHeight,
        innerHeight: window.innerHeight,
      }));
      expect(Math.abs(footerBottom - innerHeight)).toBeLessThanOrEqual(1);
      expect(scrollHeight).toBeLessThanOrEqual(innerHeight);
      await shot(page, 'footer-short', width);
    });
  }

  for (const route of [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/confirm-email',
  ]) {
    test(`${route} keeps ${GUTTER}px side gutters at 360px`, async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 900 });
      await page.goto(route);
      await expect(page.locator('main')).toHaveCount(1);
      const card = await page.locator('main').locator('> *').first().boundingBox();
      const viewport = await page.evaluate(() => document.documentElement.clientWidth);
      expect(card!.x).toBeGreaterThanOrEqual(GUTTER - 1);
      expect(card!.x + card!.width).toBeLessThanOrEqual(viewport - GUTTER + 1);
      await shot(page, `gutter${route.replace(/\//g, '-')}`, 360);
    });
  }

  for (const width of [360, 768] as const) {
    test(`the guest drawer's account tile leads to login (${width}px)`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/zz-no-such-page');
      await page.getByRole('button', { name: messages.site.header.menu }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole('link', { name: messages.account.title })).toHaveAttribute(
        'href',
        '/login',
      );
      await page.waitForTimeout(700);
      await shot(page, 'drawer-guest', width);
    });
  }
});

test.describe('shell with the real API', () => {
  test.skip(!isRealApiEnabled, realApiSkipReason);
  // default mode: tests run in order in one worker (the API is shared), and a failure does not skip the rest
  test.describe.configure({ mode: 'default' });
  test.use({ baseURL: process.env.E2E_SHELL_ORIGIN ?? webOrigin });

  let slugs: { book: string; author: string; category: string };

  test.beforeAll(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1280', 'the widths are set in the test itself');
    test.setTimeout(300_000);
    await startRealApi();
    const json = async <T>(url: string) => (await (await fetch(`${apiOrigin}${url}`)).json()) as T;
    slugs = {
      book: (await json<{ items: { slug: string }[] }>('/api/v1/books?page=1&pageSize=1')).items[0]!
        .slug,
      author: (await json<{ items: { slug: string }[] }>('/api/v1/authors?page=1&pageSize=1'))
        .items[0]!.slug,
      category: (await json<{ slug: string }[]>('/api/v1/categories'))[0]!.slug,
    };
  });

  test.afterAll(() => {
    stopRealApi();
  });

  const unknown = [
    ['book', '/books/zz-no-such-book'],
    ['author', '/authors/zz-no-such-author'],
    ['category', '/categories/zz-no-such-category'],
    ['page', '/pages/zz-no-such-page'],
  ] as const;

  for (const [name, url] of unknown) {
    for (const width of WIDTHS) {
      test(`unknown ${name}: one header, footer, main and the 404 h1 (${width}px)`, async ({
        page,
      }, testInfo) => {
        test.skip(
          testInfo.project.name !== 'desktop-1280',
          'the widths are set in the test itself',
        );
        await page.setViewportSize({ width, height: 900 });
        const response = await page.goto(url);
        expect(response?.status()).toBe(404);
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(
          messages.site.footer.notFoundTitle,
        );
        expect(await structure(page)).toEqual({ headers: 1, footers: 1, mains: 1, h1: 1 });
        await shot(page, `404-${name}`, width);
      });
    }
  }

  test('the error page keeps the shell, has one main and h1, and no overlap or edge-to-edge card', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1280', 'the widths are set in the test itself');
    test.setTimeout(300_000);
    stopRealApi();
    await expect
      .poll(
        async () => {
          try {
            return (await fetch(`${apiOrigin}/api/v1/sitemap`)).ok;
          } catch {
            return false;
          }
        },
        { timeout: 30_000 },
      )
      .toBe(false);

    const routes = [
      `/books/${slugs.book}`,
      `/authors/${slugs.author}`,
      `/categories/${slugs.category}`,
      '/pages/about',
    ];
    for (const width of WIDTHS) {
      for (const route of routes) {
        await page.setViewportSize({ width, height: 900 });
        const response = await page.goto(route);
        // In a production build the footer links prefetch /pages/about while the API is up, and the page is then served
        // from the ISR cache (revalidate 3600) with the API down: a correct 200, still inside one shell. Every other
        // route here is not cached and must be the 500 page (dev has no cache, so it is always 500).
        if (route === '/pages/about' && response?.status() === 200) {
          expect(await structure(page), `${route} @${width} (cached)`).toEqual({
            headers: 1,
            footers: 1,
            mains: 1,
            h1: 1,
          });
          continue;
        }
        expect(response?.status(), route).toBe(500);
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(
          messages.site.footer.errorTitle,
        );
        expect(await structure(page), `${route} @${width}`).toEqual({
          headers: 1,
          footers: 1,
          mains: 1,
          h1: 1,
        });

        // buttons and the reference code never overlap, and the card keeps its gutters
        const boxes = await page.evaluate(() => {
          const rect = (element: Element) => {
            const r = element.getBoundingClientRect();
            return { x: r.x, y: r.y, right: r.right, bottom: r.bottom };
          };
          const main = document.querySelector('main')!;
          const interactive = Array.from(main.querySelectorAll('button, a')).map(rect);
          const reference = main.querySelector('[data-error-reference]');
          return {
            interactive,
            reference: reference ? rect(reference) : null,
            card: rect(main.querySelector('section')!),
            viewport: document.documentElement.clientWidth,
          };
        });
        if (boxes.reference) {
          for (const control of boxes.interactive) {
            const overlaps =
              control.x < boxes.reference.right &&
              control.right > boxes.reference.x &&
              control.y < boxes.reference.bottom &&
              control.bottom > boxes.reference.y;
            expect(overlaps, `${route} @${width}: reference overlaps a control`).toBe(false);
          }
        }
        expect(boxes.card.x).toBeGreaterThanOrEqual(GUTTER - 1);
        expect(boxes.card.right).toBeLessThanOrEqual(boxes.viewport - GUTTER + 1);
        await shot(page, `500-${route.split('/')[1] ?? 'root'}`, width);
      }
    }
  });
});
