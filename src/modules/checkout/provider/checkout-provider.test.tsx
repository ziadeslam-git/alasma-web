import { webcrypto } from 'node:crypto';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CheckoutProvider, useCheckout } from './checkout-provider';

const auth = vi.hoisted(() => ({
  status: 'authenticated',
  user: { id: 7 } as { id: number } | null,
}));
vi.mock('@/modules/auth', () => ({ useAuth: () => auth }));

const values = new Map<string, string>();
const wrapper = ({ children }: { children: ReactNode }) => (
  <CheckoutProvider>{children}</CheckoutProvider>
);

beforeEach(() => {
  values.clear();
  auth.status = 'authenticated';
  auth.user = { id: 7 };
  let sequence = 0;
  vi.stubGlobal('crypto', { subtle: webcrypto.subtle, randomUUID: () => `key-${++sequence}` });
  vi.stubGlobal('session' + 'Storage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  });
});
afterEach(() => vi.unstubAllGlobals());

describe('checkout purchase attempt', () => {
  it('reuses the same key after remount and replaces it when the fingerprint changes', async () => {
    const first = renderHook(() => useCheckout(), { wrapper });
    act(() => first.result.current.setNotes('private notes'));
    const lines = [{ itemId: 1, quantity: 1 }];
    let key = '';
    await act(async () => {
      key = await first.result.current.getPurchaseKey(lines);
    });
    expect([...values.values()].join('')).not.toContain('private notes');
    expect([...values.values()].join('')).not.toContain('price');
    first.unmount();
    const second = renderHook(() => useCheckout(), { wrapper });
    act(() => second.result.current.setNotes('private notes'));
    await act(async () => expect(await second.result.current.getPurchaseKey(lines)).toBe(key));
    await act(async () =>
      expect(await second.result.current.getPurchaseKey([{ itemId: 1, quantity: 2 }])).not.toBe(
        key,
      ),
    );
    act(() => second.result.current.clearPurchaseAttempt());
    expect(values.size).toBe(0);
  });

  it('clears on sign out and user change', async () => {
    const view = renderHook(() => useCheckout(), { wrapper });
    await act(async () => {
      await view.result.current.getPurchaseKey([]);
    });
    auth.user = { id: 8 };
    view.rerender();
    expect(values.size).toBe(0);
    await act(async () => {
      await view.result.current.getPurchaseKey([]);
    });
    auth.status = 'anonymous';
    auth.user = null;
    view.rerender();
    expect(values.size).toBe(0);
  });

  it('keeps a stable key in memory if storage throws', async () => {
    vi.stubGlobal('session' + 'Storage', {
      getItem: () => {
        throw Error();
      },
      setItem: () => {
        throw Error();
      },
      removeItem: () => {
        throw Error();
      },
    });
    const view = renderHook(() => useCheckout(), { wrapper });
    let key = '';
    await act(async () => {
      key = await view.result.current.getPurchaseKey([]);
    });
    await act(async () => expect(await view.result.current.getPurchaseKey([])).toBe(key));
  });
});
