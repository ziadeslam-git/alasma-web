import { ApiError } from '@/shared/lib/api';

import {
  FRESH_MARGIN_MS,
  REFRESH_LOCK_NAME,
  REFRESH_RETRY_PAUSE_MS,
  SESSION_GONE_CODES,
} from '../auth-constants';
import type { AuthChannel, AuthMessage } from './auth-channel';
import type { SessionHint } from './session-hint';
import type { SessionStore } from './session-store';

export type RefreshedSession = { accessToken: string; expiresAt: number };

export type EnsureFreshOptions = {
  // Replace the token even if it still has life left (the dev page, the proactive timer).
  force?: boolean;
  // The token a request was rejected with. If the store already holds a different, fresh token (another call or tab
  // renewed it meanwhile) that one is used; otherwise the token is replaced.
  staleToken?: string | null;
};

// The part of navigator.locks that is used. A test double implements just this.
export type RefreshLocks = {
  request: (name: string, callback: () => Promise<string>) => Promise<string>;
};

export type RefreshCoordinatorDeps = {
  channel: AuthChannel;
  getLocks: () => RefreshLocks | undefined;
  hint: SessionHint;
  now?: () => number;
  // The one network call: POST /auth/refresh. Must not itself go through the refresh-on-401 layer.
  refresh: () => Promise<RefreshedSession>;
  store: SessionStore;
};

function isSessionGone(error: unknown) {
  return (
    error instanceof ApiError &&
    (error.status === 401 || (error.code !== undefined && SESSION_GONE_CODES.has(error.code)))
  );
}

export function createRefreshCoordinator({
  channel,
  getLocks,
  hint,
  now = Date.now,
  refresh,
  store,
}: RefreshCoordinatorDeps) {
  // The one refresh running in this tab. Every caller while it runs gets the same promise.
  let inFlight: Promise<string> | null = null;
  let pausedUntil = 0;
  let lastFailure: unknown = null;
  const remoteListeners = new Set<(message: AuthMessage) => void>();

  // What other tabs publish is applied here, so the lock holder's fresh token is seen by every waiting tab.
  channel.subscribe((message) => {
    if (message.type === 'session') {
      store.set(message.accessToken, message.expiresAt);
    } else {
      store.clear();
      hint.clear();
    }

    for (const listener of [...remoteListeners]) {
      listener(message);
    }
  });

  function publishSession(session: RefreshedSession) {
    store.set(session.accessToken, session.expiresAt);
    hint.set();
    channel.post({ type: 'session', ...session });
  }

  // The session is over (logout, dead refresh token, final 401): forget it here and tell the other tabs.
  function endSession() {
    store.clear();
    hint.clear();
    channel.post({ type: 'logout' });
  }

  async function ensureFreshSession(options: EnsureFreshOptions = {}): Promise<string> {
    const tokenAtStart = store.getAccessToken();
    const shouldReplace =
      options.force === true ||
      (options.staleToken !== undefined &&
        options.staleToken !== null &&
        options.staleToken === tokenAtStart);
    const usableToken = () => {
      const token = store.getAccessToken();

      return token !== null &&
        store.isFresh(FRESH_MARGIN_MS) &&
        !(shouldReplace && token === tokenAtStart)
        ? token
        : null;
    };

    const current = usableToken();

    if (current !== null) {
      return current;
    }

    if (inFlight) {
      return inFlight;
    }

    if (now() < pausedUntil) {
      throw lastFailure;
    }

    const perform = async (): Promise<string> => {
      // Waiting for the lock may have lasted while another tab refreshed and published: use that result.
      const published = usableToken();

      if (published !== null) {
        return published;
      }

      try {
        const session = await refresh();
        publishSession(session);
        pausedUntil = 0;

        return session.accessToken;
      } catch (error) {
        if (isSessionGone(error)) {
          endSession();
        } else {
          // Network or server trouble: keep the session, do not try again for a while.
          lastFailure = error;
          pausedUntil = now() + REFRESH_RETRY_PAUSE_MS;
        }

        throw error;
      }
    };

    // Web Locks serialise the refresh across the tabs of this browser (a second parallel refresh would make the API
    // treat the rotated cookie as reused). Without Web Locks the refresh is serialised inside this tab only.
    const locks = getLocks();
    const run = locks ? locks.request(REFRESH_LOCK_NAME, perform) : perform();
    const shared = run.finally(() => {
      inFlight = null;
    });
    inFlight = shared;

    return shared;
  }

  return {
    endSession,
    ensureFreshSession,
    publishSession,
    subscribeRemote(listener: (message: AuthMessage) => void) {
      remoteListeners.add(listener);

      return () => {
        remoteListeners.delete(listener);
      };
    },
  };
}

export type RefreshCoordinator = ReturnType<typeof createRefreshCoordinator>;
