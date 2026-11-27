import { createBrowserClient, type BrowserClientHooks } from '@/shared/lib/api';
import { createAdminClient, type AdminClient } from '@/shared/lib/api/admin';

import { endSession, ensureFreshSession } from '../session/auth-session';
import { notifyForbidden } from '../session/forbidden-events';
import { sessionHint } from '../session/session-hint';
import { sessionStore } from '../session/session-store';
import { createAuthApi } from './auth-api';

type ApiClient = ReturnType<typeof createBrowserClient>;

// A 5 MB image over a slow mobile connection needs far more than the default 15 seconds. Only the upload client
// (getUploadApiClient) uses this value; every other call keeps the default timeout.
export const UPLOAD_TIMEOUT_MS = 60_000;

const EMAIL_NOT_CONFIRMED_CODE = 'email_not_confirmed';

let client: ApiClient | null = null;
let uploadClient: ApiClient | null = null;
let adminClient: AdminClient | null = null;
let adminUploadClient: AdminClient | null = null;

// Bearer token from memory, and on a 401 (outside the auth routes) one shared refresh and one retry.
const hooks: BrowserClientHooks = {
  getAccessToken: () => sessionStore.getAccessToken(),
  onUnauthorized: () => {
    // a visitor with no session who hits a protected endpoint has nothing to end
    if (sessionStore.getAccessToken() !== null || sessionHint.has()) {
      endSession();
    }
  },
  onForbidden: async ({ response }) => {
    if (sessionStore.getAccessToken() === null) {
      return;
    }

    // 403 email_not_confirmed is about the account, not about a permission: the admin area ignores it
    const problem = (await response.json().catch(() => null)) as { code?: unknown } | null;

    if (problem?.code !== EMAIL_NOT_CONFIRMED_CODE) {
      notifyForbidden();
    }
  },
  refreshAccessToken: async ({ staleToken }) => {
    if (sessionStore.getAccessToken() === null && !sessionHint.has()) {
      return null;
    }

    try {
      return await ensureFreshSession({ staleToken });
    } catch {
      return null;
    }
  },
};

// The browser client every feature uses. Created on first use, in the browser.
export function getApiClient(): ApiClient {
  client ??= createBrowserClient(hooks);

  return client;
}

// The client of every /api/v1/admin/* call: the same hooks (token from memory, one shared refresh, onForbidden), plus an
// X-Correlation-Id on each request. Admin file uploads pass `timeoutMs: UPLOAD_TIMEOUT_MS` through the second argument.
export function getAdminApiClient(): AdminClient {
  adminClient ??= createAdminClient(hooks);

  return adminClient;
}

export function getAdminUploadApiClient(): AdminClient {
  adminUploadClient ??= createAdminClient(hooks, { timeoutMs: UPLOAD_TIMEOUT_MS });

  return adminUploadClient;
}

// The same client with a longer timeout, for file uploads only.
export function getUploadApiClient(): ApiClient {
  uploadClient ??= createBrowserClient(hooks, { timeoutMs: UPLOAD_TIMEOUT_MS });

  return uploadClient;
}

export const getAuthApi = () => createAuthApi(getApiClient());
