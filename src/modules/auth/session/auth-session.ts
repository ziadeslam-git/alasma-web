import { createBrowserClient } from '@/shared/lib/api';

import { createAuthApi } from '../api/auth-api';
import { createBroadcastAuthChannel } from './auth-channel';
import {
  createRefreshCoordinator,
  type EnsureFreshOptions,
  type RefreshCoordinator,
} from './refresh-coordinator';
import { sessionHint } from './session-hint';
import { sessionStore } from './session-store';

let coordinator: RefreshCoordinator | null = null;

// Created on first use in the browser (never while rendering on the server: it opens a BroadcastChannel).
function getCoordinator(): RefreshCoordinator {
  if (coordinator) {
    return coordinator;
  }

  // The refresh call uses its own client with no token and no refresh-on-401 layer: a failing refresh must never
  // start another refresh.
  const refreshApi = createAuthApi(createBrowserClient({ getAccessToken: () => null }));
  coordinator = createRefreshCoordinator({
    channel: createBroadcastAuthChannel(),
    getLocks: () => {
      const locks = globalThis.navigator?.locks;

      return locks
        ? { request: async (name, callback) => await locks.request(name, () => callback()) }
        : undefined;
    },
    hint: sessionHint,
    refresh: async () => {
      const response = await refreshApi.refresh();

      return { accessToken: response.accessToken, expiresAt: Date.parse(response.expiresAt) };
    },
    store: sessionStore,
  });

  return coordinator;
}

// The one function every caller uses to get a usable access token. See refresh-coordinator.ts.
export const ensureFreshSession = (options?: EnsureFreshOptions) =>
  getCoordinator().ensureFreshSession(options);
export const endSession = () => getCoordinator().endSession();
export const publishSession = (session: { accessToken: string; expiresAt: number }) =>
  getCoordinator().publishSession(session);
export const subscribeRemote = (...args: Parameters<RefreshCoordinator['subscribeRemote']>) =>
  getCoordinator().subscribeRemote(...args);

// Tests only: forgets the singleton so the next call builds a new one (new channel, no pause, no refresh in flight).
export function resetAuthSessionForTests() {
  coordinator = null;
}
