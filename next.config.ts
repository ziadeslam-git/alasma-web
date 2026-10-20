import type { NextConfig } from 'next';

import { defaultApiOrigin } from './src/shared/lib/api/api-origin';

// Kept minimal on purpose: the ISR rules in the Architecture page (revalidate + tags) rely on the classic
// caching model, so cacheComponents and the other opt-in features are not enabled.
const nextConfig: NextConfig = {
  reactStrictMode: true,
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
