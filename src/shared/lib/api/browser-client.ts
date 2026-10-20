import createClient, { type Middleware } from 'openapi-fetch';

import { ApiError } from './api-error';
import { parseResponseError, parseThrownError } from './parse-error';
import type { paths } from './schema';

export type BrowserClientHooks = {
  // Supplies the in-memory access token (the AuthProvider of F1.9 provides it). Never read it from web storage.
  getAccessToken: () => string | null | undefined;
  // Called once for every 401 response, before the ApiError is thrown. The layer does NOT retry the request: the
  // single-flight refresh and the retry belong to the AuthProvider.
  onUnauthorized?: (info: { request: Request; response: Response }) => void | Promise<void>;
};

export type BrowserClientOptions = {
  // The origin the paths are appended to; the paths already start with /api/v1. Defaults to the page origin, so
  // calls stay same-origin and go through the Next rewrite.
  baseUrl?: string;
  timeoutMs?: number;
  fetch?: (input: Request) => Promise<Response>;
};

export const defaultTimeoutMs = 15_000;

function withTimeout(
  send: (input: Request) => Promise<Response>,
  timeoutMs: number,
): (input: Request) => Promise<Response> {
  return (input) => {
    const signal = AbortSignal.any([input.signal, AbortSignal.timeout(timeoutMs)]);

    return send(new Request(input, { signal }));
  };
}

function createMiddleware(hooks: BrowserClientHooks): Middleware {
  return {
    onRequest({ request }) {
      const token = hooks.getAccessToken();

      if (token) {
        request.headers.set('Authorization', `Bearer ${token}`);
      }

      return request;
    },
    async onResponse({ request, response }) {
      if (response.ok) {
        return undefined;
      }

      if (response.status === 401) {
        await hooks.onUnauthorized?.({ request, response: response.clone() });
      }

      throw await parseResponseError(response);
    },
    onError({ error }) {
      return error instanceof ApiError ? undefined : parseThrownError(error);
    },
  };
}

// For Client Components: same-origin, cookies included, bearer token from the injected getter, every failure
// thrown as an ApiError (a non-2xx response, a network failure or a timeout).
export function createBrowserClient(hooks: BrowserClientHooks, options: BrowserClientOptions = {}) {
  const send = options.fetch ?? ((input: Request) => globalThis.fetch(input));
  const client = createClient<paths>({
    baseUrl: options.baseUrl ?? globalThis.location?.origin ?? '',
    credentials: 'include',
    fetch: withTimeout(send, options.timeoutMs ?? defaultTimeoutMs),
  });

  client.use(createMiddleware(hooks));

  return client;
}
