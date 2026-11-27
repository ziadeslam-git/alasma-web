import {
  createBrowserClient,
  type BrowserClientHooks,
  type BrowserClientOptions,
} from '../browser-client';

// The API accepts 1 to 64 characters of letters, digits, `_`, `.` and `-` as a correlation id; anything else is
// replaced by the server, which would break the trace. A UUID fits.
const FALLBACK_ID_LENGTH = 16;

export function createCorrelationId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  return Math.random()
    .toString(36)
    .slice(2, 2 + FALLBACK_ID_LENGTH)
    .padEnd(FALLBACK_ID_LENGTH, '0');
}

// The client of every /api/v1/admin/* call. It is the same browser client as the rest of the app (bearer token from
// memory, `credentials: 'include'`, one shared refresh on a 401, onForbidden on a 403, every failure thrown as an
// ApiError), plus an `X-Correlation-Id` on each request. The auth module passes its hooks, so the session logic stays
// in one place.
export function createAdminClient(hooks: BrowserClientHooks, options: BrowserClientOptions = {}) {
  return createBrowserClient(hooks, { createCorrelationId, ...options });
}

export type AdminClient = ReturnType<typeof createAdminClient>;
