// Test doubles for the browser features the auth module uses: BroadcastChannel (other tabs), Web Locks and a cookie
// jar. Each "tab" in a test gets its own channel from the same bus.
import type { AuthChannel, AuthMessage } from '@/modules/auth/session/auth-channel';
import type { RefreshLocks } from '@/modules/auth/session/refresh-coordinator';

export function createChannelBus() {
  const members = new Set<{ listeners: Set<(message: AuthMessage) => void> }>();
  const sent: AuthMessage[] = [];

  return {
    // every message ever posted by any member, in order
    sent,
    join(): AuthChannel {
      const member = { listeners: new Set<(message: AuthMessage) => void>() };
      members.add(member);

      return {
        close: () => members.delete(member),
        post(message) {
          sent.push(message);

          for (const other of members) {
            if (other === member) {
              continue;
            }

            for (const listener of [...other.listeners]) {
              // delivered asynchronously, like a real BroadcastChannel
              queueMicrotask(() => listener(message));
            }
          }
        },
        subscribe(listener) {
          member.listeners.add(listener);

          return () => member.listeners.delete(listener);
        },
      };
    },
  };
}

// One lock name at a time, first come first served, like navigator.locks.
export function createFakeLocks() {
  let tail: Promise<unknown> = Promise.resolve();
  const state = { grants: 0 };

  const locks: RefreshLocks = {
    request(_name, callback) {
      const run = tail.then(() => {
        state.grants += 1;

        return callback();
      });
      tail = run.catch(() => undefined);

      return run;
    },
  };

  return { locks, state };
}

// A document-like object whose cookie property behaves like a jar for plain name=value cookies.
export function createCookieJar() {
  const values = new Map<string, string>();
  const writes: string[] = [];

  const doc = {
    get cookie() {
      return [...values].map(([name, value]) => `${name}=${value}`).join('; ');
    },
    set cookie(text: string) {
      writes.push(text);
      const [pair = '', ...attributes] = text.split(';');
      const [name = '', value = ''] = pair.split('=');
      const isExpired = attributes.some(
        (attribute) => attribute.trim().toLowerCase() === 'max-age=0',
      );

      if (isExpired) {
        values.delete(name.trim());
      } else {
        values.set(name.trim(), value.trim());
      }
    },
  };

  return { doc: doc as unknown as Document, writes };
}

export function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });

  return { promise, reject, resolve };
}

type Listener = (event: { data: unknown }) => void;

// A BroadcastChannel that talks to the other instances with the same name in this test process.
export class FakeBroadcastChannel {
  static instances: FakeBroadcastChannel[] = [];
  private readonly listeners = new Set<Listener>();
  readonly name: string;

  constructor(name: string) {
    this.name = name;
    FakeBroadcastChannel.instances.push(this);
  }

  addEventListener(_type: 'message', listener: Listener) {
    this.listeners.add(listener);
  }

  removeEventListener(_type: 'message', listener: Listener) {
    this.listeners.delete(listener);
  }

  postMessage(data: unknown) {
    for (const other of FakeBroadcastChannel.instances) {
      if (other !== this && other.name === this.name) {
        queueMicrotask(() => other.listeners.forEach((listener) => listener({ data })));
      }
    }
  }

  close() {
    FakeBroadcastChannel.instances = FakeBroadcastChannel.instances.filter((one) => one !== this);
  }
}
