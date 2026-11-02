import { afterEach, describe, expect, it, vi } from 'vitest';

import { DEV_IMAGE_HOSTS, getDevImageHosts } from './dev-image-hosts';

describe('development image hosts', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('returns no patterns or CSP hosts in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(getDevImageHosts()).toEqual({ remotePatterns: [], cspHosts: [] });
  });

  it('returns the two HTTPS hosts in development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(DEV_IMAGE_HOSTS).toEqual(['picsum.photos', 'fastly.picsum.photos']);
    expect(getDevImageHosts()).toEqual({
      remotePatterns: [
        { protocol: 'https', hostname: 'picsum.photos', port: '', pathname: '/**' },
        { protocol: 'https', hostname: 'fastly.picsum.photos', port: '', pathname: '/**' },
      ],
      cspHosts: ['https://picsum.photos', 'https://fastly.picsum.photos'],
    });
  });
});
