import { SESSION_HINT_COOKIE, SESSION_HINT_MAX_AGE_SECONDS } from '../auth-constants';

// The hint cookie is not a credential: it only lets the app skip the refresh call for visitors who never signed in.
// It is readable by script on purpose (the refresh cookie is not, and the front end never reads that one).
export type SessionHint = {
  clear: () => void;
  has: () => boolean;
  set: () => void;
};

export function createSessionHint(doc: () => Document | undefined): SessionHint {
  return {
    clear() {
      const target = doc();

      if (target) {
        target.cookie = `${SESSION_HINT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
      }
    },
    has() {
      const target = doc();

      return (
        target?.cookie.split(';').some((part) => part.trim() === `${SESSION_HINT_COOKIE}=1`) ??
        false
      );
    },
    set() {
      const target = doc();

      if (!target) {
        return;
      }

      const secure = globalThis.location?.protocol === 'https:' ? '; Secure' : '';
      target.cookie = `${SESSION_HINT_COOKIE}=1; Path=/; Max-Age=${SESSION_HINT_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
    },
  };
}

export const sessionHint = createSessionHint(() =>
  typeof document === 'undefined' ? undefined : document,
);
