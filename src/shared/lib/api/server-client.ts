import createClient from 'openapi-fetch';

import { defaultApiOrigin } from './api-origin';
import type { paths } from './schema';

export type ServerClientOptions = {
  // The API origin, without a path. Defaults to API_ORIGIN, then http://localhost:5198.
  origin?: string;
  fetch?: (input: Request) => Promise<Response>;
};

// For Server Components and ISR: absolute URL, no cookies, no authorization. Pass Next's revalidate and tags per call
// with nextFetch(). A failed response comes back as `error` (not thrown): use throwIfError() from this folder when
// the page should fail.
export function createServerClient(options: ServerClientOptions = {}) {
  const baseUrl = (options.origin ?? process.env.API_ORIGIN ?? defaultApiOrigin).replace(
    /\/+$/,
    '',
  );

  return createClient<paths>({
    baseUrl,
    credentials: 'omit',
    ...(options.fetch ? { fetch: options.fetch } : {}),
  });
}
