import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { server } from '@/mocks/server';
import { createOrder } from './create-order';

vi.mock('@/modules/auth', async () => {
  const { createBrowserClient } = await import('@/shared/lib/api');
  return {
    getApiClient: () =>
      createBrowserClient({ getAccessToken: () => 'token' }, { baseUrl: 'http://localhost' }),
  };
});

const url = 'http://localhost/api/v1/orders';
const body = {
  addressId: 1,
  paymentMethod: 'CashOnDelivery' as const,
  couponCode: null,
  notes: null,
};
const key = '12345678-1234-1234-1234-123456789abc';

describe('create order', () => {
  it.each([200, 201])('accepts a successful response with status %i', async (status) => {
    server.use(
      http.post(url, async ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBe(key);
        expect(await request.json()).toEqual(body);
        return HttpResponse.json(
          { id: key },
          { status, headers: { 'Idempotency-Replayed': 'true' } },
        );
      }),
    );
    await expect(createOrder(body, key)).resolves.toMatchObject({ id: key });
  });
  it.each([
    [400, 'idempotency_key_required'],
    [401, 'auth_unauthenticated'],
    [403, 'email_not_confirmed'],
    [404, 'addresses_not_found'],
    [404, 'coupon_not_found'],
    [409, 'stock_insufficient'],
    [409, 'cart_has_unavailable_items'],
    [409, 'coupon_busy'],
    [409, 'idempotency_in_progress'],
    [422, 'idempotency_key_mismatch'],
    [422, 'cart_empty'],
    [422, 'order_line_price_invalid'],
    [422, 'shipping_zone_unavailable'],
    [422, 'payment_method_unavailable'],
    [422, 'coupon_inactive'],
    [422, 'coupon_below_minimum'],
    [422, 'coupon_exceeds_subtotal'],
    [422, 'coupon_exhausted'],
    [422, 'coupon_expired'],
    [422, 'coupon_not_started'],
    [422, 'coupon_user_limit_reached'],
  ])('propagates %i %s', async (status, code) => {
    server.use(http.post(url, () => HttpResponse.json({ code }, { status })));
    await expect(createOrder(body, key)).rejects.toMatchObject({ status, code });
  });
  it('propagates a network failure', async () => {
    server.use(http.post(url, () => HttpResponse.error()));
    await expect(createOrder(body, key)).rejects.toMatchObject({ kind: 'network' });
  });
});
