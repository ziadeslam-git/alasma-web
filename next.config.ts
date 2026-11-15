import type { NextConfig } from 'next';

import { CLOUDINARY_CLOUD_NAME } from './src/shared/config/cloudinary';
import { getApiRewrites } from './src/shared/config/api-rewrites';
import { getDevImageHosts } from './src/shared/config/dev-image-hosts';
import { buildSecurityHeaders } from './src/shared/config/security-headers';

// Kept minimal on purpose: the ISR rules in the Architecture page (revalidate + tags) rely on the classic
// caching model, so cacheComponents and the other opt-in features are not enabled.
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
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
      ...getDevImageHosts().remotePatterns,
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
  // ADR-18: same-origin /api/v1 so the refresh cookie stays same-origin. Active in development, and in production
  // when API_ORIGIN is set (see src/shared/config/api-rewrites.ts).
  async rewrites() {
    return getApiRewrites(process.env);
  },
};

export default nextConfig;
