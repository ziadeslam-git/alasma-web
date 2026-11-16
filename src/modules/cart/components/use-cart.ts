'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/modules/auth';
import { getCart, type Cart } from '../api/cart-api';
import { CART_CHANGED_EVENT } from '../cart-events';

type CartState = { userId: number; cart: Cart | null; error: unknown; isLoading: boolean };

// One GET /cart for every useCart() that mounts while a load for the same user is still in flight. Without it, React
// StrictMode's double effect in development and two consumers mounting together (the header mini cart and the checkout
// page) each sent their own request (Task 72). A change to the cart drops the shared load, so a reader that mounts
// after a change never receives the cart from before it; refresh() after a change always fetches.
let sharedLoad: { userId: number; promise: Promise<Cart> } | null = null;

function loadCartOnce(userId: number): Promise<Cart> {
  if (sharedLoad?.userId === userId) return sharedLoad.promise;
  const promise = getCart();
  const entry = { userId, promise };
  sharedLoad = entry;
  const release = () => {
    if (sharedLoad === entry) sharedLoad = null;
  };
  promise.then(release, release);
  return promise;
}

export function useCart() {
  const { status, user } = useAuth();
  const userId = status === 'authenticated' ? user?.id : undefined;
  const [state, setState] = useState<CartState | null>(null);
  const requestVersion = useRef(0);
  const refresh = useCallback(async () => {
    if (userId === undefined) return;
    const version = ++requestVersion.current;
    setState((current) => ({
      userId,
      cart: current?.userId === userId ? current.cart : null,
      error: null,
      isLoading: true,
    }));
    try {
      const cart = await getCart();
      if (version === requestVersion.current)
        setState({ userId, cart, error: null, isLoading: false });
    } catch (error) {
      if (version === requestVersion.current)
        setState({ userId, cart: null, error, isLoading: false });
    }
  }, [userId]);
  useEffect(() => {
    if (userId === undefined) return;
    let isActive = true;
    const version = ++requestVersion.current;
    void loadCartOnce(userId)
      .then((cart) => {
        if (isActive && version === requestVersion.current)
          setState({ userId, cart, error: null, isLoading: false });
      })
      .catch((error: unknown) => {
        if (isActive && version === requestVersion.current)
          setState({ userId, cart: null, error, isLoading: false });
      });
    const onChange = () => {
      sharedLoad = null;
      void refresh();
    };
    window.addEventListener(CART_CHANGED_EVENT, onChange);
    return () => {
      isActive = false;
      requestVersion.current += 1;
      window.removeEventListener(CART_CHANGED_EVENT, onChange);
    };
  }, [refresh, userId]);
  const current = userId !== undefined && state?.userId === userId ? state : null;
  return {
    cart: current?.cart ?? null,
    isLoading:
      status === 'loading' || (userId !== undefined && (current === null || current.isLoading)),
    error: current?.error ?? null,
    refresh,
  };
}
