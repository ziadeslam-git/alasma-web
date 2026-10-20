// The access token lives here, in a module variable, and nowhere else: not in web storage, not in a cookie, not in
// React state. A page reload empties it (the refresh cookie brings the session back). No React in this file.
type Session = { accessToken: string; expiresAt: number };
type Listener = () => void;

export type SessionStore = {
  clear: () => void;
  getAccessToken: () => string | null;
  getExpiresAt: () => number | null;
  // True when the token has at least `marginMs` of life left.
  isFresh: (marginMs: number) => boolean;
  set: (accessToken: string, expiresAt: number) => void;
  subscribe: (listener: Listener) => () => void;
};

export function createSessionStore(now: () => number = Date.now): SessionStore {
  let session: Session | null = null;
  const listeners = new Set<Listener>();

  const notify = () => {
    for (const listener of [...listeners]) {
      listener();
    }
  };

  return {
    clear() {
      if (session === null) {
        return;
      }

      session = null;
      notify();
    },
    getAccessToken: () => session?.accessToken ?? null,
    getExpiresAt: () => session?.expiresAt ?? null,
    isFresh: (marginMs) => session !== null && session.expiresAt - now() >= marginMs,
    set(accessToken, expiresAt) {
      session = { accessToken, expiresAt };
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export const sessionStore = createSessionStore();
