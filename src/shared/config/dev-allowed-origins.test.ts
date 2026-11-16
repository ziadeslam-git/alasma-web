import { describe, expect, it } from 'vitest';

import { DEFAULT_DEV_ALLOWED_ORIGINS, getDevAllowedOrigins } from './dev-allowed-origins';

describe('development allowed origins', () => {
  it('returns nothing in production, even when the variable is set', () => {
    expect(
      getDevAllowedOrigins({ NODE_ENV: 'production', DEV_ALLOWED_ORIGINS: '10.0.0.5' }),
    ).toEqual([]);
  });

  it('defaults to the home LAN range in development', () => {
    expect(getDevAllowedOrigins({ NODE_ENV: 'development' })).toEqual([
      ...DEFAULT_DEV_ALLOWED_ORIGINS,
    ]);
    expect(DEFAULT_DEV_ALLOWED_ORIGINS).toEqual(['192.168.*.*']);
  });

  it('reads a comma separated list from DEV_ALLOWED_ORIGINS and drops blanks', () => {
    expect(
      getDevAllowedOrigins({
        NODE_ENV: 'development',
        DEV_ALLOWED_ORIGINS: ' 10.0.0.5 , ,*.tunnel.dev',
      }),
    ).toEqual(['10.0.0.5', '*.tunnel.dev']);
  });
});
