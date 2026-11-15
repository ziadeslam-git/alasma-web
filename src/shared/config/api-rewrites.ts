// Relative import on purpose: next.config.ts loads this file before the `@/` alias exists.
import { defaultApiOrigin } from '../lib/api/api-origin';

type RewriteEnv = { NODE_ENV?: string | undefined; API_ORIGIN?: string | undefined };

export type ApiRewrite = { source: string; destination: string };

// ADR-18: the browser calls /api/v1/* on the Next origin and Next forwards it to the API, so the refresh cookie stays
// same-origin. In development the local API is the default. In production the rewrite is active only when API_ORIGIN
// is set explicitly (never the default, which is a local address); otherwise the host or a reverse proxy must provide it.
export function getApiRewrites(env: RewriteEnv): ApiRewrite[] {
  const configured = env.API_ORIGIN?.trim();
  const isProduction = env.NODE_ENV === 'production';

  if (isProduction && !configured) {
    return [];
  }

  const origin = (configured || defaultApiOrigin).replace(/\/+$/, '');

  return [{ source: '/api/v1/:path*', destination: `${origin}/api/v1/:path*` }];
}
