// The cookie the front end writes (never the API). It only says "a refresh cookie probably exists", so an anonymous
// visitor makes no /auth/refresh request. It holds no secret and no user data.
export const SESSION_HINT_COOKIE = 'alasma_has_session';
// Same lifetime as the refresh cookie (7 days).
export const SESSION_HINT_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export const REFRESH_LOCK_NAME = 'alasma-auth-refresh';
export const AUTH_CHANNEL_NAME = 'alasma-auth';

// An access token with at least this much life left is used as it is.
export const FRESH_MARGIN_MS = 30_000;
// The provider renews this long before the token expires (the token lives 5 minutes).
export const PROACTIVE_REFRESH_LEAD_MS = 45_000;
// After a refresh that failed for a network or server reason, no new attempt is made for this long. The session is
// kept (it may still be good), and nothing retries in a tight loop.
export const REFRESH_RETRY_PAUSE_MS = 30_000;

// Backend codes that mean "this refresh token is gone": the session is over, clear everything. The backend sends
// auth_refresh_invalid for a missing, expired, revoked or reused token; the other two are accepted as well.
export const SESSION_GONE_CODES: ReadonlySet<string> = new Set([
  'auth_refresh_invalid',
  'refresh_expired',
  'refresh_reused',
]);
