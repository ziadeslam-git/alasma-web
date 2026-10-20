'use client';

import { useEffect } from 'react';

import { PROACTIVE_REFRESH_LEAD_MS, REFRESH_RETRY_PAUSE_MS } from '../auth-constants';
import { ensureFreshSession } from '../session/auth-session';
import { sessionStore } from '../session/session-store';

// The largest delay setTimeout accepts; a longer one fires at once.
const MAX_TIMER_MS = 2 ** 31 - 1;

// Renews the access token shortly before it expires while a session is active. Timers are throttled in background
// tabs, so the check also runs when the tab becomes visible again. Cleared on logout and unmount.
export function useProactiveRefresh(isActive: boolean) {
  useEffect(() => {
    if (!isActive) {
      return undefined;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    let isStopped = false;

    const evaluate = (afterRefresh = false) => {
      clearTimeout(timer);
      const expiresAt = sessionStore.getExpiresAt();

      if (isStopped || expiresAt === null) {
        return;
      }

      const wait = expiresAt - Date.now() - PROACTIVE_REFRESH_LEAD_MS;

      if (wait > 0 || afterRefresh) {
        // right after a refresh, never wait less than the pause: a token that is already due (clock skew) must not
        // make a tight loop
        const delay = afterRefresh ? Math.max(wait, REFRESH_RETRY_PAUSE_MS) : wait;
        timer = setTimeout(() => evaluate(), Math.min(delay, MAX_TIMER_MS));

        return;
      }

      ensureFreshSession({ force: true }).then(
        () => evaluate(true),
        () => {
          // a dead session already cleared the store; any other failure waits before the next try
          if (!isStopped && sessionStore.getAccessToken() !== null) {
            timer = setTimeout(() => evaluate(), REFRESH_RETRY_PAUSE_MS);
          }
        },
      );
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        evaluate();
      }
    };

    evaluate();
    const unsubscribe = sessionStore.subscribe(() => evaluate());
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      isStopped = true;
      clearTimeout(timer);
      unsubscribe();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [isActive]);
}
