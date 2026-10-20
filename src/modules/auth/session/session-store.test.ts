import { describe, expect, it, vi } from 'vitest';

import { createSessionHint } from './session-hint';
import { createSessionStore } from './session-store';
import { createCookieJar } from '@/test/auth-doubles';

describe('session store', () => {
  it('holds the token and tells subscribers about every change', () => {
    let clock = 0;
    const store = createSessionStore(() => clock);
    const listener = vi.fn();
    const stop = store.subscribe(listener);

    store.set('abc', 100_000);
    expect(store.getAccessToken()).toBe('abc');
    expect(store.getExpiresAt()).toBe(100_000);
    expect(store.isFresh(30_000)).toBe(true);

    clock = 70_001;
    expect(store.isFresh(30_000)).toBe(false);

    store.clear();
    store.clear();
    expect(store.getAccessToken()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(2);

    stop();
    store.set('def', 1);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});

describe('session hint', () => {
  it('sets, reads and removes a plain flag cookie with the documented attributes', () => {
    const jar = createCookieJar();
    const hint = createSessionHint(() => jar.doc);

    expect(hint.has()).toBe(false);
    hint.set();
    expect(hint.has()).toBe(true);
    expect(jar.writes[0]).toBe('alasma_has_session=1; Path=/; Max-Age=604800; SameSite=Lax');

    hint.clear();
    expect(hint.has()).toBe(false);
  });

  it('is a no-op without a document', () => {
    const hint = createSessionHint(() => undefined);

    hint.set();
    hint.clear();

    expect(hint.has()).toBe(false);
  });
});
