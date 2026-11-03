import { afterEach, describe, expect, it, vi } from 'vitest';

import robots, { ROBOTS_DISALLOW_PATHS } from './robots';

describe('robots.ts', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('allows /, disallows private and API prefixes and points to the sitemap index', () => {
    vi.stubEnv('SITE_URL', 'https://alasma.com/');

    expect(robots()).toEqual({
      rules: {
        userAgent: '*',
        allow: '/',
        disallow: ['/account', '/admin', '/cart', '/checkout', '/dev', '/api'],
      },
      sitemap: 'https://alasma.com/sitemap.xml',
    });
    expect(ROBOTS_DISALLOW_PATHS).toHaveLength(6);
  });
});
