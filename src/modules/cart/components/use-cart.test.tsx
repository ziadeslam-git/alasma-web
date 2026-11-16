import { act, renderHook, waitFor } from '@testing-library/react';
import { StrictMode, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Cart } from '../api/cart-api';
import { notifyCartChanged } from '../cart-events';
import { useCart } from './use-cart';

const getCart = vi.fn<() => Promise<Cart>>();

vi.mock('../api/cart-api', () => ({ getCart: () => getCart() }));
vi.mock('@/modules/auth', () => ({
  useAuth: () => ({ status: 'authenticated', user: { id: 7 } }),
}));

const emptyCart = { items: [] } as unknown as Cart;
const strict = ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode>;

describe('useCart', () => {
  beforeEach(() => {
    getCart.mockReset();
    getCart.mockResolvedValue(emptyCart);
  });

  it('sends one GET /cart for consumers that mount together, even under StrictMode', async () => {
    const first = renderHook(() => useCart(), { wrapper: strict });
    const second = renderHook(() => useCart(), { wrapper: strict });

    await waitFor(() => expect(first.result.current.isLoading).toBe(false));
    await waitFor(() => expect(second.result.current.isLoading).toBe(false));
    expect(getCart).toHaveBeenCalledTimes(1);
    expect(first.result.current.cart).toBe(emptyCart);
  });

  it('fetches again after the cart changes', async () => {
    const { result } = renderHook(() => useCart());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const calls = getCart.mock.calls.length;

    act(() => notifyCartChanged());

    await waitFor(() => expect(getCart.mock.calls.length).toBe(calls + 1));
  });
});
