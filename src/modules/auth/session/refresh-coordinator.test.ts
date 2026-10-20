import { describe, expect, it, vi } from 'vitest';

import { createChannelBus, createCookieJar, createFakeLocks, deferred } from '@/test/auth-doubles';

import { ApiError } from '@/shared/lib/api';

import { FRESH_MARGIN_MS, REFRESH_RETRY_PAUSE_MS, SESSION_HINT_COOKIE } from '../auth-constants';
import {
  createRefreshCoordinator,
  type RefreshedSession,
  type RefreshLocks,
} from './refresh-coordinator';
import { createSessionHint } from './session-hint';
import { createSessionStore } from './session-store';

const fiveMinutes = 5 * 60 * 1000;

function makeTab(options: {
  bus: ReturnType<typeof createChannelBus>;
  locks?: RefreshLocks | undefined;
  now: () => number;
  refresh: () => Promise<RefreshedSession>;
}) {
  const store = createSessionStore(options.now);
  const jar = createCookieJar();
  const hint = createSessionHint(() => jar.doc);
  const coordinator = createRefreshCoordinator({
    channel: options.bus.join(),
    getLocks: () => options.locks,
    hint,
    now: options.now,
    refresh: options.refresh,
    store,
  });

  return { coordinator, hint, store };
}

const session = (token: string, now: number): RefreshedSession => ({
  accessToken: token,
  expiresAt: now + fiveMinutes,
});

describe('refresh coordinator', () => {
  it('makes ONE refresh request for five concurrent callers in a tab', async () => {
    const clock = 1_000_000;
    const gate = deferred<RefreshedSession>();
    const refresh = vi.fn(() => gate.promise);
    const { coordinator, store } = makeTab({
      bus: createChannelBus(),
      locks: createFakeLocks().locks,
      now: () => clock,
      refresh,
    });

    const calls = Array.from({ length: 5 }, () => coordinator.ensureFreshSession());
    gate.resolve(session('token-1', clock));

    expect(await Promise.all(calls)).toEqual(Array(5).fill('token-1'));
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(store.getAccessToken()).toBe('token-1');
  });

  it('returns the current token without a request while it has at least 30 seconds left', async () => {
    let clock = 0;
    const refresh = vi.fn(async () => session('new', clock));
    const { coordinator, store } = makeTab({
      bus: createChannelBus(),
      now: () => clock,
      refresh,
    });
    store.set('current', fiveMinutes);

    expect(await coordinator.ensureFreshSession()).toBe('current');
    clock = fiveMinutes - FRESH_MARGIN_MS;
    expect(await coordinator.ensureFreshSession()).toBe('current');
    expect(refresh).not.toHaveBeenCalled();

    clock += 1;
    expect(await coordinator.ensureFreshSession()).toBe('new');
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('forces a refresh, or replaces a token a request was rejected with', async () => {
    const clock = 0;
    let count = 0;
    const refresh = vi.fn(async () => session(`token-${(count += 1)}`, clock));
    const { coordinator, store } = makeTab({ bus: createChannelBus(), now: () => clock, refresh });
    store.set('old', fiveMinutes);

    expect(await coordinator.ensureFreshSession({ force: true })).toBe('token-1');
    // the rejected token is no longer the stored one, so the stored (fresh) one is used as it is
    expect(await coordinator.ensureFreshSession({ staleToken: 'old' })).toBe('token-1');
    expect(await coordinator.ensureFreshSession({ staleToken: 'token-1' })).toBe('token-2');
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it('reuses the token a second tab published while this tab waited for the lock', async () => {
    const clock = 0;
    const bus = createChannelBus();
    const { locks, state } = createFakeLocks();
    const gate = deferred<RefreshedSession>();
    const refreshA = vi.fn(() => gate.promise);
    const refreshB = vi.fn(async () => session('from-b', clock));
    const tabA = makeTab({ bus, locks, now: () => clock, refresh: refreshA });
    const tabB = makeTab({ bus, locks, now: () => clock, refresh: refreshB });

    const callA = tabA.coordinator.ensureFreshSession();
    const callB = tabB.coordinator.ensureFreshSession();
    gate.resolve(session('from-a', clock));

    expect(await callA).toBe('from-a');
    expect(await callB).toBe('from-a');
    expect(refreshA).toHaveBeenCalledTimes(1);
    expect(refreshB).not.toHaveBeenCalled();
    expect(state.grants).toBe(2);
    expect(tabB.store.getAccessToken()).toBe('from-a');
  });

  it('still makes one request per tab when Web Locks are missing', async () => {
    const clock = 0;
    const gate = deferred<RefreshedSession>();
    const refresh = vi.fn(() => gate.promise);
    const { coordinator } = makeTab({
      bus: createChannelBus(),
      locks: undefined,
      now: () => clock,
      refresh,
    });

    const calls = [coordinator.ensureFreshSession(), coordinator.ensureFreshSession()];
    gate.resolve(session('solo', clock));

    expect(await Promise.all(calls)).toEqual(['solo', 'solo']);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('publishes the new token to the other tabs and writes the hint', async () => {
    const clock = 0;
    const bus = createChannelBus();
    const tab = makeTab({
      bus,
      now: () => clock,
      refresh: async () => session('published', clock),
    });

    await tab.coordinator.ensureFreshSession();

    expect(bus.sent).toEqual([
      { type: 'session', accessToken: 'published', expiresAt: clock + fiveMinutes },
    ]);
    expect(tab.hint.has()).toBe(true);
  });

  it.each(['auth_refresh_invalid', 'refresh_expired', 'refresh_reused'])(
    'clears the session, the hint and the other tabs when the refresh says %s',
    async (code) => {
      const clock = 0;
      const bus = createChannelBus();
      const tab = makeTab({
        bus,
        now: () => clock,
        refresh: async () => {
          throw new ApiError({ kind: 'problem', status: 401, code });
        },
      });
      tab.store.set('old', fiveMinutes);
      tab.hint.set();

      await expect(tab.coordinator.ensureFreshSession({ force: true })).rejects.toBeInstanceOf(
        ApiError,
      );

      expect(tab.store.getAccessToken()).toBeNull();
      expect(tab.hint.has()).toBe(false);
      expect(bus.sent).toEqual([{ type: 'logout' }]);
    },
  );

  it('keeps the session after a network failure and does not retry before the pause is over', async () => {
    let clock = 0;
    const refresh = vi.fn(async (): Promise<RefreshedSession> => {
      throw new ApiError({ kind: 'network' });
    });
    const tab = makeTab({ bus: createChannelBus(), now: () => clock, refresh });
    tab.store.set('old', fiveMinutes);
    tab.hint.set();

    await expect(tab.coordinator.ensureFreshSession({ force: true })).rejects.toMatchObject({
      kind: 'network',
    });
    await expect(tab.coordinator.ensureFreshSession({ force: true })).rejects.toMatchObject({
      kind: 'network',
    });
    await expect(tab.coordinator.ensureFreshSession({ force: true })).rejects.toMatchObject({
      kind: 'network',
    });

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(tab.store.getAccessToken()).toBe('old');
    expect(tab.hint.has()).toBe(true);

    clock = REFRESH_RETRY_PAUSE_MS;
    await expect(tab.coordinator.ensureFreshSession({ force: true })).rejects.toBeInstanceOf(
      ApiError,
    );
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it('applies a logout from another tab and a session from another tab', async () => {
    const clock = 0;
    const bus = createChannelBus();
    const tabA = makeTab({ bus, now: () => clock, refresh: async () => session('a', clock) });
    const tabB = makeTab({ bus, now: () => clock, refresh: async () => session('b', clock) });
    const heard = vi.fn();
    tabB.coordinator.subscribeRemote(heard);

    tabA.coordinator.publishSession(session('signed-in', clock));
    await Promise.resolve();
    expect(tabB.store.getAccessToken()).toBe('signed-in');
    expect(heard).toHaveBeenLastCalledWith({
      type: 'session',
      accessToken: 'signed-in',
      expiresAt: clock + fiveMinutes,
    });

    tabA.coordinator.endSession();
    await Promise.resolve();
    expect(tabB.store.getAccessToken()).toBeNull();
    expect(heard).toHaveBeenLastCalledWith({ type: 'logout' });
  });

  it('writes only the hint cookie, never the token', async () => {
    const clock = 0;
    const jar = createCookieJar();
    const store = createSessionStore(() => clock);
    const coordinator = createRefreshCoordinator({
      channel: createChannelBus().join(),
      getLocks: () => undefined,
      hint: createSessionHint(() => jar.doc),
      now: () => clock,
      refresh: async () => session('secret-token-value', clock),
      store,
    });

    await coordinator.ensureFreshSession();

    expect(jar.writes).toHaveLength(1);
    expect(jar.writes[0]).toMatch(new RegExp(`^${SESSION_HINT_COOKIE}=1;`));
    expect(jar.writes.join('')).not.toContain('secret-token-value');
  });
});
