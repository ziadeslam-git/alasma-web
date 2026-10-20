import createClient, { type Middleware } from 'openapi-fetch';

import { ApiError } from './api-error';
import { parseResponseError, parseThrownError } from './parse-error';
import type { paths } from './schema';

export type BrowserClientHooks = {
  // Supplies the in-memory access token (the AuthProvider of F1.9 provides it). Never read it from web storage.
  getAccessToken: () => string | null | undefined;
  // Called once for every 401 response, before the ApiError is thrown. Without `refreshAccessToken` the layer does
  // not retry. With it, the call happens only after the retry also got a 401 (or the refresh failed), and never for
  // the auth routes below.
  onUnauthorized?: (info: { request: Request; response: Response }) => void | Promise<void>;
  // Gets a new access token after a 401 on a non-auth route, or null when there is no session to renew. The auth
  // module supplies it (one shared refresh per tab and across tabs). The request is then sent ONE more time with the
  // new token; a second 401 is final. `staleToken` is the token the rejected request carried.
  refreshAccessToken?: (info: { staleToken: string | null }) => Promise<string | null>;
};

export type BrowserClientOptions = {
  // The origin the paths are appended to; the paths already start with /api/v1. Defaults to the page origin, so
  // calls stay same-origin and go through the Next rewrite.
  baseUrl?: string;
  timeoutMs?: number;
  fetch?: (input: Request) => Promise<Response>;
};

export const defaultTimeoutMs = 15_000;

// A 401 here means "wrong credentials / dead refresh token", not "expired access token", so it never triggers a
// refresh (a refresh on these routes would loop or hide the real error).
export const authRoutePaths: ReadonlySet<string> = new Set([
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/refresh',
  '/api/v1/auth/logout',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/reset-password',
  '/api/v1/auth/confirm-email',
]);

function withTimeout(
  send: (input: Request) => Promise<Response>,
  timeoutMs: number,
): (input: Request) => Promise<Response> {
  return (input) => {
    const signal = AbortSignal.any([input.signal, AbortSignal.timeout(timeoutMs)]);

    return send(new Request(input, { signal }));
  };
}

function createMiddleware(
  hooks: BrowserClientHooks,
  send: (input: Request) => Promise<Response>,
): Middleware {
  // An untouched copy of each in-flight request, kept only to resend it once after a refresh (a body can be read
  // once). Only filled when the hook exists, and always emptied when the response arrives.
  const pending = new Map<string, { copy: Request; token: string | null }>();

  async function retryOnce(id: string, schemaPath: string, response: Response): Promise<Response> {
    const entry = pending.get(id);

    if (!entry || authRoutePaths.has(schemaPath) || !hooks.refreshAccessToken) {
      return response;
    }

    const fresh = await hooks.refreshAccessToken({ staleToken: entry.token }).catch(() => null);

    if (!fresh) {
      return response;
    }

    const headers = new Headers(entry.copy.headers);
    headers.set('Authorization', `Bearer ${fresh}`);

    try {
      return await send(new Request(entry.copy, { headers }));
    } catch (error) {
      throw parseThrownError(error);
    }
  }

  return {
    async onRequest({ request, id }) {
      const token = hooks.getAccessToken();

      if (token) {
        request.headers.set('Authorization', `Bearer ${token}`);
      }

      if (hooks.refreshAccessToken) {
        pending.set(id, { copy: request.clone(), token: token ?? null });
      }

      return request;
    },
    async onResponse({ request, response, schemaPath, id }) {
      if (response.ok) {
        pending.delete(id);

        return undefined;
      }

      let final = response;

      if (response.status === 401 && hooks.refreshAccessToken) {
        try {
          final = await retryOnce(id, schemaPath, response);
        } finally {
          pending.delete(id);
        }

        if (final.ok) {
          return final;
        }
      }

      pending.delete(id);

      const isAuthRoute = authRoutePaths.has(schemaPath);

      if (final.status === 401 && !(hooks.refreshAccessToken && isAuthRoute)) {
        await hooks.onUnauthorized?.({ request, response: final.clone() });
      }

      throw await parseResponseError(final);
    },
    onError({ error, id }) {
      pending.delete(id);

      return error instanceof ApiError ? undefined : parseThrownError(error);
    },
  };
}

// For Client Components: same-origin, cookies included, bearer token from the injected getter, every failure
// thrown as an ApiError (a non-2xx response, a network failure or a timeout).
export function createBrowserClient(hooks: BrowserClientHooks, options: BrowserClientOptions = {}) {
  const send = withTimeout(
    options.fetch ?? ((input: Request) => globalThis.fetch(input)),
    options.timeoutMs ?? defaultTimeoutMs,
  );
  const client = createClient<paths>({
    baseUrl: options.baseUrl ?? globalThis.location?.origin ?? '',
    credentials: 'include',
    fetch: send,
  });

  client.use(createMiddleware(hooks, send));

  return client;
}
