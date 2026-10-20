import { createBrowserClient } from '@/shared/lib/api';

import { endSession, ensureFreshSession } from '../session/auth-session';
import { sessionHint } from '../session/session-hint';
import { sessionStore } from '../session/session-store';
import { createAuthApi } from './auth-api';

type ApiClient = ReturnType<typeof createBrowserClient>;

let client: ApiClient | null = null;

// The browser client every feature uses: bearer token from memory, and on a 401 (outside the auth routes) one
// shared refresh and one retry. Created on first use, in the browser.
export function getApiClient(): ApiClient {
  client ??= createBrowserClient({
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
  });

  return client;
}

export const getAuthApi = () => createAuthApi(getApiClient());
