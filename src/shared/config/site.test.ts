import { afterEach, describe, expect, it, vi } from 'vitest';

import { absoluteUrl, DEFAULT_SITE_URL, getSiteUrl, resetSiteUrlWarningForTests } from './site';

describe('site URL helpers', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    resetSiteUrlWarningForTests();
  });

  it('returns the local fallback outside production when SITE_URL is unset', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('SITE_URL', '');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(getSiteUrl()).toBe(DEFAULT_SITE_URL);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('validates http(s) URLs and strips trailing slashes', () => {
    vi.stubEnv('SITE_URL', 'https://alasma.com///');

    expect(getSiteUrl()).toBe('https://alasma.com');
  });

  it('rejects non-http schemes, credentials or malformed values and falls back safely', () => {
    for (const invalid of [
      'ftp://alasma.com',
      'javascript:alert(1)',
      '//alasma.com',
      'https://user:pass@alasma.com',
      'https://alasma.com?x=1',
      'not a url',
    ]) {
      vi.stubEnv('SITE_URL', invalid);
      expect(getSiteUrl()).toBe(DEFAULT_SITE_URL);
    }
  });

  it('logs one clear build warning in production when SITE_URL is missing and still succeeds', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('SITE_URL', '');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(getSiteUrl()).toBe(DEFAULT_SITE_URL);
    expect(getSiteUrl()).toBe(DEFAULT_SITE_URL);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]?.[0]).toContain('SITE_URL');
  });

  it('joins paths safely and percent-encodes Arabic and special characters without double encoding', () => {
    vi.stubEnv('SITE_URL', 'https://alasma.com/');

    expect(absoluteUrl('/')).toBe('https://alasma.com/');
    expect(absoluteUrl('/books')).toBe('https://alasma.com/books');
    expect(absoluteUrl('books/رواية-جديدة')).toBe(
      'https://alasma.com/books/%D8%B1%D9%88%D8%A7%D9%8A%D8%A9-%D8%AC%D8%AF%D9%8A%D8%AF%D8%A9',
    );
    expect(
      absoluteUrl('/books/%D8%B1%D9%88%D8%A7%D9%8A%D8%A9-%D8%AC%D8%AF%D9%8A%D8%AF%D8%A9'),
    ).toBe(
      'https://alasma.com/books/%D8%B1%D9%88%D8%A7%D9%8A%D8%A9-%D8%AC%D8%AF%D9%8A%D8%AF%D8%A9',
    );
    expect(absoluteUrl('/books?page=2')).toBe('https://alasma.com/books?page=2');
  });
});
