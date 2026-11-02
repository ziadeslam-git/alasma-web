import type { NextConfig } from 'next';

export const DEV_IMAGE_HOSTS = ['picsum.photos', 'fastly.picsum.photos'] as const;

type RemotePattern = NonNullable<NonNullable<NextConfig['images']>['remotePatterns']>[number];

export function getDevImageHosts(): { remotePatterns: RemotePattern[]; cspHosts: string[] } {
  if (process.env.NODE_ENV === 'production') {
    return { remotePatterns: [], cspHosts: [] };
  }

  return {
    remotePatterns: DEV_IMAGE_HOSTS.map((hostname) => ({
      protocol: 'https',
      hostname,
      port: '',
      pathname: '/**',
    })),
    cspHosts: DEV_IMAGE_HOSTS.map((hostname) => `https://${hostname}`),
  };
}
