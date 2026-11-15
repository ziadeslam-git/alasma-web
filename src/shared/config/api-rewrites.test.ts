import { describe, expect, it } from 'vitest';

import { defaultApiOrigin } from '@/shared/lib/api/api-origin';

import { getApiRewrites } from './api-rewrites';

describe('getApiRewrites (ADR-18: same-origin /api/v1)', () => {
  it('forwards /api/v1 to API_ORIGIN in production when it is set', () => {
    expect(
      getApiRewrites({ NODE_ENV: 'production', API_ORIGIN: 'https://api.example.com' }),
    ).toEqual([{ source: '/api/v1/:path*', destination: 'https://api.example.com/api/v1/:path*' }]);
  });

  it('does not fall back to the default origin in production', () => {
    expect(getApiRewrites({ NODE_ENV: 'production' })).toEqual([]);
    expect(getApiRewrites({ NODE_ENV: 'production', API_ORIGIN: '' })).toEqual([]);
    expect(getApiRewrites({ NODE_ENV: 'production', API_ORIGIN: '   ' })).toEqual([]);
  });

  it('falls back to the default origin in development, as before', () => {
    expect(getApiRewrites({ NODE_ENV: 'development' })).toEqual([
      { source: '/api/v1/:path*', destination: `${defaultApiOrigin}/api/v1/:path*` },
    ]);
    expect(getApiRewrites({})).toEqual([
      { source: '/api/v1/:path*', destination: `${defaultApiOrigin}/api/v1/:path*` },
    ]);
  });

  it('uses API_ORIGIN in development when it is set', () => {
    expect(
      getApiRewrites({ NODE_ENV: 'development', API_ORIGIN: 'http://localhost:5391' }),
    ).toEqual([{ source: '/api/v1/:path*', destination: 'http://localhost:5391/api/v1/:path*' }]);
  });

  it('removes trailing slashes from the origin', () => {
    expect(
      getApiRewrites({ NODE_ENV: 'production', API_ORIGIN: 'https://api.example.com//' }),
    ).toEqual([{ source: '/api/v1/:path*', destination: 'https://api.example.com/api/v1/:path*' }]);
  });
});
