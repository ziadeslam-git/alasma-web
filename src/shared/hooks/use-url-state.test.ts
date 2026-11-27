import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { applyUrlPatch, useUrlState } from './use-url-state';

const nav = vi.hoisted(() => ({ replace: vi.fn(), search: '' }));

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/orders',
  useRouter: () => ({ replace: nav.replace }),
  useSearchParams: () => new URLSearchParams(nav.search),
}));

describe('applyUrlPatch', () => {
  it('writes a filter and resets the page to 1 (page is dropped)', () => {
    expect(applyUrlPatch('page=4&q=old', { q: 'novel' })).toBe('q=novel');
  });

  it('keeps the other filters and sorts the keys', () => {
    expect(applyUrlPatch('status=Shipped', { q: 'a' })).toBe('q=a&status=Shipped');
  });

  it('removes a key when the value is empty or null', () => {
    expect(applyUrlPatch('q=a&status=Shipped', { q: '', status: null })).toBe('');
  });

  it('changing only the page keeps the filters and never writes page=1', () => {
    expect(applyUrlPatch('q=a', { page: 3 })).toBe('page=3&q=a');
    expect(applyUrlPatch('page=3&q=a', { page: 1 })).toBe('q=a');
  });

  it('caps pageSize at 100 and drops a bad one', () => {
    expect(applyUrlPatch('', { pageSize: 500 })).toBe('pageSize=100');
    expect(applyUrlPatch('pageSize=25', { pageSize: 'abc' })).toBe('');
    expect(applyUrlPatch('page=2', { pageSize: 50 })).toBe('pageSize=50');
  });

  it('drops an invalid page value', () => {
    expect(applyUrlPatch('page=2', { page: 'abc' })).toBe('');
    expect(applyUrlPatch('', { page: 0 })).toBe('');
  });
});

describe('useUrlState', () => {
  beforeEach(() => {
    nav.replace.mockClear();
    nav.search = 'page=3&status=Shipped';
  });

  it('update() uses router.replace without scrolling and resets the page', () => {
    const { result } = renderHook(() => useUrlState());

    result.current.update({ q: 'x' });

    expect(nav.replace).toHaveBeenCalledWith('/admin/orders?q=x&status=Shipped', { scroll: false });
  });

  it('replaces with the bare path when nothing is left', () => {
    nav.search = 'q=a';
    const { result } = renderHook(() => useUrlState());

    result.current.update({ q: null });

    expect(nav.replace).toHaveBeenCalledWith('/admin/orders', { scroll: false });
  });

  it('hrefFor() builds a link without navigating', () => {
    const { result } = renderHook(() => useUrlState());

    expect(result.current.hrefFor({ page: 4 })).toBe('/admin/orders?page=4&status=Shipped');
    expect(nav.replace).not.toHaveBeenCalled();
  });
});
