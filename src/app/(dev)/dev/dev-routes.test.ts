import fs from 'node:fs';
import path from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import AuthDevPage from './auth/page';
import CatalogDevPage from './catalog/page';
import CatalogFiltersDevPage from './catalog-filters/page';
import ComponentsPage from './components/page';
import ErrorTestPage from './error-test/page';
import HomeDevPage from './home/page';
import IconsPage from './icons/page';
import TokensPage from './tokens/page';

const NOT_FOUND_SENTINEL = 'NEXT_NOT_FOUND';

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error(NOT_FOUND_SENTINEL);
  },
}));

describe('dev routes production guard', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([
    ['/dev/auth', () => AuthDevPage()],
    ['/dev/catalog', () => CatalogDevPage()],
    ['/dev/catalog-filters', () => CatalogFiltersDevPage({ searchParams: Promise.resolve({}) })],
    ['/dev/components', () => ComponentsPage()],
    ['/dev/error-test', () => ErrorTestPage()],
    ['/dev/home', () => HomeDevPage({ searchParams: Promise.resolve({}) })],
    ['/dev/icons', () => IconsPage()],
    ['/dev/tokens', () => TokensPage()],
  ])('calls notFound() on %s when NODE_ENV is production', async (_route, renderPage) => {
    vi.stubEnv('NODE_ENV', 'production');

    await expect(Promise.resolve().then(renderPage)).rejects.toThrow(NOT_FOUND_SENTINEL);
  });

  it('guards every page.tsx under src/app/(dev)/dev', () => {
    const devRoot = path.resolve(process.cwd(), 'src/app/(dev)/dev');
    const entries = fs.readdirSync(devRoot, { withFileTypes: true });
    const routeDirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);

    expect(routeDirs.sort()).toEqual([
      'auth',
      'catalog',
      'catalog-filters',
      'components',
      'error-test',
      'home',
      'icons',
      'tokens',
    ]);

    for (const dir of routeDirs) {
      const pagePath = path.join(devRoot, dir, 'page.tsx');
      const source = fs.readFileSync(pagePath, 'utf8');
      expect(source).toContain("process.env.NODE_ENV === 'production'");
      expect(source).toContain('notFound()');
    }
  });
});
