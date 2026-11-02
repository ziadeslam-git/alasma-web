'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { getAuthApi } from '../api/auth-client';
import { AuthContext, type AuthContextValue } from '../auth-context';
import { useProactiveRefresh } from '../hooks/use-proactive-refresh';
import {
  endSession,
  ensureFreshSession,
  publishSession,
  subscribeRemote,
} from '../session/auth-session';
import { sessionHint } from '../session/session-hint';
import { sessionStore } from '../session/session-store';
import type { AuthStatus, AuthUser, LoginCredentials } from '../types';

type State = { status: AuthStatus; user: AuthUser | null };

const loadingState: State = { status: 'loading', user: null };
const anonymousState: State = { status: 'anonymous', user: null };

// Mounted once from the root layout. The server and the first client render are both 'loading' (the server cannot
// see the refresh cookie), then the browser restores the session from the refresh cookie when the hint cookie says
// one may exist. The access token itself is never in this state: it lives in the session store.
export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [state, setState] = useState<State>(loadingState);
  const hasUser = useRef(false);

  useEffect(() => {
    hasUser.current = state.user !== null;
  }, [state.user]);

  const loadUser = useCallback(async () => {
    const user = await getAuthApi().me();
    setState({ status: 'authenticated', user });
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const bootstrap = async () => {
      if (!sessionHint.has()) {
        setState(anonymousState);

        return;
      }

      try {
        await ensureFreshSession();

        // React Strict Mode mounts twice in development: the first run stops here, so /me is requested once
        if (isCancelled) {
          return;
        }

        const user = await getAuthApi().me();

        if (!isCancelled) {
          setState({ status: 'authenticated', user });
        }
      } catch {
        if (!isCancelled) {
          setState(anonymousState);
        }
      }
    };

    void bootstrap();

    // Another tab signed in or out. A new session there is loaded here only when this tab has no user yet.
    const stopRemote = subscribeRemote((message) => {
      if (message.type === 'logout') {
        setState(anonymousState);
      } else if (!hasUser.current) {
        void loadUser().catch(() => setState(anonymousState));
      }
    });
    // The session ended in this tab (dead refresh token, final 401).
    const stopStore = sessionStore.subscribe(() => {
      if (sessionStore.getAccessToken() === null) {
        setState((current) => (current.status === 'authenticated' ? anonymousState : current));
      }
    });

    return () => {
      isCancelled = true;
      stopRemote();
      stopStore();
    };
  }, [loadUser]);

  useProactiveRefresh(state.status === 'authenticated');

  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthUser> => {
    const api = getAuthApi();
    const response = await api.login(credentials);
    const session = {
      accessToken: response.accessToken,
      expiresAt: Date.parse(response.expiresAt),
    };

    sessionStore.set(session.accessToken, session.expiresAt);

    try {
      const user = await api.me();
      publishSession(session);
      setState({ status: 'authenticated', user });

      return user;
    } catch (error) {
      endSession();
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await getAuthApi().logout();
    } catch {
      // the API may be down or the cookie already gone: the local session ends either way
    }

    endSession();
    setState(anonymousState);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ login, logout, status: state.status, user: state.user }),
    [login, logout, state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
