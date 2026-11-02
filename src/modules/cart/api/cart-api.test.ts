import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { server } from '@/mocks/server';
import {
  addBook,
  clearCart,
  getCart,
  removeItem,
  updateQuantity,
  validateCoupon,
} from './cart-api';

vi.mock('@/modules/auth', async () => {
  const { createBrowserClient } = await import('@/shared/lib/api');
  return {
    getApiClient: () =>
      createBrowserClient({ getAccessToken: () => 'token' }, { baseUrl: 'http://localhost' }),
  };
});

const base = 'http://localhost/api/v1';
const cart = { items: [], subtotal: 0 };

describe('cart API', () => {
  it('reads, adds, updates, removes and clears the server cart', async () => {
    let adds = 0;
    server.use(
      http.get(`${base}/cart`, () => HttpResponse.json(cart)),
      http.delete(`${base}/cart`, () => new HttpResponse(null, { status: 204 })),
      http.post(`${base}/cart/items`, async ({ request }) => {
        expect(await request.json()).toEqual({ bookId: 1, bundleId: null, quantity: 1 });
        adds += 1;
        return HttpResponse.json(cart, { status: adds === 1 ? 201 : 200 });
      }),
      http.put(`${base}/cart/items/:id`, () => HttpResponse.json(cart)),
      http.delete(`${base}/cart/items/:id`, () => new HttpResponse(null, { status: 204 })),
    );
    expect(await getCart()).toEqual(cart);
    await expect(addBook(1)).resolves.toBeUndefined();
    await expect(addBook(1)).resolves.toBeUndefined();
    await expect(updateQuantity(1, 2)).resolves.toBeUndefined();
    await expect(removeItem(1)).resolves.toBeUndefined();
    await expect(clearCart()).resolves.toBeUndefined();
  });
  it('returns the API coupon result', async () => {
    const coupon = {
      code: 'SAVE',
      discountAmount: 12,
      discountType: 'FixedAmount',
      subtotal: 100,
      subtotalAfterDiscount: 88,
    };
    server.use(http.post(`${base}/coupons/validate`, () => HttpResponse.json(coupon)));
    expect(await validateCoupon('SAVE')).toEqual(coupon);
  });
  it('propagates a network failure', async () => {
    server.use(http.get(`${base}/cart`, () => HttpResponse.error()));
    await expect(getCart()).rejects.toMatchObject({ kind: 'network' });
  });
  it.each([400, 401, 403, 404, 409, 422, 429])(
    'throws an API error on add failure %i',
    async (status) => {
      server.use(
        http.post(`${base}/cart/items`, () =>
          HttpResponse.json({ code: 'stock_insufficient', availableQuantity: 2 }, { status }),
        ),
      );
      await expect(addBook(1)).rejects.toMatchObject({ status });
    },
  );

  const errorCases = [
    { name: 'read', method: 'get', path: '/cart', statuses: [401, 403, 429], run: getCart },
    { name: 'clear', method: 'delete', path: '/cart', statuses: [401, 403, 429], run: clearCart },
    {
      name: 'update',
      method: 'put',
      path: '/cart/items/:id',
      statuses: [400, 401, 403, 404, 409, 422, 429],
      run: () => updateQuantity(1, 2),
    },
    {
      name: 'remove',
      method: 'delete',
      path: '/cart/items/:id',
      statuses: [400, 401, 403, 404, 429],
      run: () => removeItem(1),
    },
    {
      name: 'coupon',
      method: 'post',
      path: '/coupons/validate',
      statuses: [400, 401, 403, 404, 422, 429],
      run: () => validateCoupon('SAVE'),
    },
  ] as const;
  for (const entry of errorCases) {
    it.each(entry.statuses)(`${entry.name} propagates documented failure %i`, async (status) => {
      server.use(
        http[entry.method](`${base}${entry.path}`, () =>
          HttpResponse.json({ code: 'test_error' }, { status }),
        ),
      );
      await expect(entry.run()).rejects.toMatchObject({ status });
    });
  }
});
