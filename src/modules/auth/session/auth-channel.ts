import { AUTH_CHANNEL_NAME } from '../auth-constants';

// What the tabs tell each other. The token is passed only between tabs of this browser profile and origin (a
// BroadcastChannel cannot leave them), and each tab keeps it in memory.
export type AuthMessage =
  { type: 'session'; accessToken: string; expiresAt: number } | { type: 'logout' };

export type AuthChannel = {
  close: () => void;
  post: (message: AuthMessage) => void;
  subscribe: (listener: (message: AuthMessage) => void) => () => void;
};

// Without BroadcastChannel (old browsers, some privacy modes) the tabs just do not hear each other: every tab still
// refreshes safely on its own, only the cross-tab shortcut is lost.
export const silentChannel: AuthChannel = {
  close: () => undefined,
  post: () => undefined,
  subscribe: () => () => undefined,
};

export function createBroadcastAuthChannel(): AuthChannel {
  if (typeof BroadcastChannel === 'undefined') {
    return silentChannel;
  }

  const channel = new BroadcastChannel(AUTH_CHANNEL_NAME);

  return {
    close: () => channel.close(),
    post: (message) => channel.postMessage(message),
    subscribe(listener) {
      const handle = (event: MessageEvent<AuthMessage>) => listener(event.data);
      channel.addEventListener('message', handle);

      return () => channel.removeEventListener('message', handle);
    },
  };
}
