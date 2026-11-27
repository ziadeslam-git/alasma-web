import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useCan } from './use-can';

const mocks = vi.hoisted(() => ({
  auth: { status: 'authenticated', user: { permissions: ['Books.Edit'] } } as {
    status: string;
    user: { permissions: string[] } | null;
  },
}));

vi.mock('@/modules/auth', () => ({ useAuth: () => mocks.auth }));

describe('useCan', () => {
  beforeEach(() => {
    mocks.auth = { status: 'authenticated', user: { permissions: ['Books.Edit'] } };
  });

  it('is true for a single permission the user has', () => {
    expect(renderHook(() => useCan('Books.Edit')).result.current).toBe(true);
  });

  it('is false for a single permission the user lacks', () => {
    expect(renderHook(() => useCan('Orders.View')).result.current).toBe(false);
  });

  it('handles anyOf', () => {
    expect(renderHook(() => useCan({ anyOf: ['Orders.View', 'Books.Edit'] })).result.current).toBe(
      true,
    );
    expect(renderHook(() => useCan({ anyOf: ['Orders.View'] })).result.current).toBe(false);
  });

  it('is false for an empty anyOf and for an empty permission list', () => {
    expect(renderHook(() => useCan({ anyOf: [] })).result.current).toBe(false);
    mocks.auth = { status: 'authenticated', user: { permissions: [] } };
    expect(renderHook(() => useCan('Books.Edit')).result.current).toBe(false);
  });

  it('is false while the session loads and for a visitor', () => {
    mocks.auth = { status: 'loading', user: null };
    expect(renderHook(() => useCan('Books.Edit')).result.current).toBe(false);
    mocks.auth = { status: 'anonymous', user: null };
    expect(renderHook(() => useCan('Books.Edit')).result.current).toBe(false);
  });
});
