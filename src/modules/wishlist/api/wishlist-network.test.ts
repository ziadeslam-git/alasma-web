import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { server } from '@/mocks/server';
import { ApiError } from '@/shared/lib/api';

vi.mock('@/modules/auth', async () => {
  const { createBrowserClient } = await import('@/shared/lib/api');
  return {
    getApiClient: () =>
      createBrowserClient({ getAccessToken: () => 'token' }, { baseUrl: 'http://localhost' }),
  };
});
import { addToWishlist, getWishlist, getWishlistIds, removeFromWishlist } from './wishlist-api';

const base = 'http://localhost/api/v1/wishlist';

describe('wishlist API: network failure', () => {
  it.each([
    ['list', () => getWishlist()],
    ['ids', () => getWishlistIds()],
    ['add', () => addToWishlist(1)],
    ['remove', () => removeFromWishlist(1)],
  ])('rejects %s with an ApiError of kind network', async (_name, call) => {
    server.use(
      http.get(base, () => HttpResponse.error()),
      http.get(`${base}/ids`, () => HttpResponse.error()),
      http.put(`${base}/:id`, () => HttpResponse.error()),
      http.delete(`${base}/:id`, () => HttpResponse.error()),
    );

    const error = await call().catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).kind).toBe('network');
  });
});
