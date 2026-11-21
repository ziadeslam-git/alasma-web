import { createBrowserClient, type BrowserClientHooks } from '@/shared/lib/api';

import { endSession, ensureFreshSession } from '../session/auth-session';
import { sessionHint } from '../session/session-hint';
import { sessionStore } from '../session/session-store';
import { createAuthApi } from './auth-api';

type ApiClient = ReturnType<typeof createBrowserClient>;

// A 5 MB image over a slow mobile connection needs far more than the default 15 seconds. Only the upload client
// (getUploadApiClient) uses this value; every other call keeps the default timeout.
export const UPLOAD_TIMEOUT_MS = 60_000;

let client: ApiClient | null = null;
let uploadClient: ApiClient | null = null;

// Bearer token from memory, and on a 401 (outside the auth routes) one shared refresh and one retry.
const hooks: BrowserClientHooks = {
  getAccessToken: () => sessionStore.getAccessToken(),
  onUnauthorized: () => {
    // a visitor with no session who hits a protected endpoint has nothing to end
    if (sessionStore.getAccessToken() !== null || sessionHint.has()) {
      endSession();
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

// The same client with a longer timeout, for file uploads only.
export function getUploadApiClient(): ApiClient {
  uploadClient ??= createBrowserClient(hooks, { timeoutMs: UPLOAD_TIMEOUT_MS });

  return uploadClient;
}

export const getAuthApi = () => createAuthApi(getApiClient());
