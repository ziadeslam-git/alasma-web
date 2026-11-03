import { webcrypto } from 'node:crypto';
import { act, renderHook } from '@testing-library/react';
import { createElement, Fragment, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AttemptSessionObserver } from './attempt-session-observer';
import { ATTEMPT_TTL_MS, clearAttempt, readAttempt, writeAttempt } from './attempt-storage';
import { CheckoutProvider, useCheckout } from './checkout-provider';

const auth = vi.hoisted(() => ({
  status: 'authenticated',
  user: { id: 7 } as { id: number } | null,
}));
vi.mock('@/modules/auth', () => ({ useAuth: () => auth }));

afterEach(() => vi.unstubAllGlobals());

function useStorage() {
  const values = new Map<string, string>();
  let sequence = 0;
  vi.stubGlobal('crypto', { subtle: webcrypto.subtle, randomUUID: () => `uuid-${++sequence}` });
  vi.stubGlobal('session' + 'Storage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  });
  return values;
}

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(
    Fragment,
    null,
    createElement(AttemptSessionObserver),
    createElement(CheckoutProvider, null, children),
  );

describe('purchase attempt storage', () => {
  it('persists only the key, hash and creation time without notes text or price, and clears on success', async () => {
    const values = useStorage();
    auth.status = 'authenticated';
    auth.user = { id: 7 };
    const hook = renderHook(() => useCheckout(), { wrapper });
    act(() => {
      hook.result.current.setAddressId(1);
      hook.result.current.setAppliedCouponCode('SAVE10');
      hook.result.current.setPaymentMethod('CashOnDelivery');
      hook.result.current.setNotes('Sensitive private delivery notes 199.99');
    });
    let key = '';
    await act(async () => {
      key = await hook.result.current.getPurchaseKey([{ itemId: 1, quantity: 2 }]);
    });
    expect(key).toBe('uuid-1');
    const stored = [...values.values()].join('');
    expect(stored).not.toContain('Sensitive private delivery notes');
    expect(stored).not.toContain('199.99');
    expect(stored).not.toContain('price');
    expect(readAttempt()?.key).toBe('uuid-1');

    act(() => hook.result.current.clearPurchaseAttempt());
    expect(readAttempt()).toBeNull();
    expect(values.size).toBe(0);
  });

  it('removes expired attempts past the TTL', () => {
    const values = useStorage();
    writeAttempt({ key: 'uuid', fingerprintHash: 'hash', createdAt: 100 });
    expect(readAttempt(100 + ATTEMPT_TTL_MS - 1)?.key).toBe('uuid');
    expect(readAttempt(100 + ATTEMPT_TTL_MS)).toBeNull();
    expect(values.size).toBe(0);
  });

  it('replaces the stored attempt when the fingerprint changes', async () => {
    useStorage();
    auth.status = 'authenticated';
    auth.user = { id: 7 };
    const hook = renderHook(() => useCheckout(), { wrapper });
    let firstKey = '';
    let secondKey = '';
    await act(async () => {
      firstKey = await hook.result.current.getPurchaseKey([{ itemId: 1, quantity: 1 }]);
    });
    await act(async () => {
      expect(await hook.result.current.getPurchaseKey([{ itemId: 1, quantity: 1 }])).toBe(firstKey);
    });
    act(() => hook.result.current.setNotes('updated note'));
    await act(async () => {
      secondKey = await hook.result.current.getPurchaseKey([{ itemId: 1, quantity: 1 }]);
    });
    expect(secondKey).not.toBe(firstKey);
    expect(readAttempt()?.key).toBe(secondKey);
  });

  it('clears the stored attempt on sign-out and user change', async () => {
    const values = useStorage();
    auth.status = 'authenticated';
    auth.user = { id: 7 };
    const hook = renderHook(() => useCheckout(), { wrapper });
    await act(async () => {
      await hook.result.current.getPurchaseKey([{ itemId: 1, quantity: 1 }]);
    });
    expect(values.size).toBe(1);

    auth.user = { id: 8 };
    hook.rerender();
    expect(values.size).toBe(0);

    await act(async () => {
      await hook.result.current.getPurchaseKey([{ itemId: 1, quantity: 1 }]);
    });
    expect(values.size).toBe(1);

    auth.status = 'anonymous';
    auth.user = null;
    hook.rerender();
    expect(values.size).toBe(0);
  });

  it('handles unavailable storage that throws', () => {
    vi.stubGlobal('session' + 'Storage', {
      getItem: () => {
        throw new Error('unavailable');
      },
      setItem: () => {
        throw new Error('unavailable');
      },
      removeItem: () => {
        throw new Error('unavailable');
      },
    });
    expect(() =>
      writeAttempt({ key: 'uuid', fingerprintHash: 'hash', createdAt: 100 }),
    ).not.toThrow();
    expect(readAttempt(100)).toBeNull();
    expect(() => clearAttempt()).not.toThrow();
  });
});
