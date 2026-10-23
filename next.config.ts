import type { NextConfig } from 'next';

import { CLOUDINARY_CLOUD_NAME } from './src/shared/config/cloudinary';
import { buildSecurityHeaders } from './src/shared/config/security-headers';
import { defaultApiOrigin } from './src/shared/lib/api/api-origin';

// Kept minimal on purpose: the ISR rules in the Architecture page (revalidate + tags) rely on the classic
// caching model, so cacheComponents and the other opt-in features are not enabled.
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Set only by the e2e dev server (playwright.config.ts) so it can run next to the owner's own `next dev`: Next allows
  // one dev server per output folder. Unset (the normal case) keeps the default .next.
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: `/${CLOUDINARY_CLOUD_NAME}/**`,
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: buildSecurityHeaders(),
      },
    ];
  },
  // Development only (ADR-18): the browser calls /api/v1/* on the Next origin and Next forwards it to the API, so the
  // refresh cookie stays same-origin. In production the host (same-site domains or a reverse proxy) does this.
  async rewrites() {
    if (process.env.NODE_ENV === 'production') {
      return [];
    }

    const origin = (process.env.API_ORIGIN ?? defaultApiOrigin).replace(/\/+$/, '');

    return [{ source: '/api/v1/:path*', destination: `${origin}/api/v1/:path*` }];
  },
};

export default nextConfig;
