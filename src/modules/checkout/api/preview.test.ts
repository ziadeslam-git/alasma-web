import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { server } from '@/mocks/server';
import { previewCheckout } from './preview';

vi.mock('@/modules/auth', async () => {
  const { createBrowserClient } = await import('@/shared/lib/api');
  return {
    getApiClient: () =>
      createBrowserClient({ getAccessToken: () => 'token' }, { baseUrl: 'http://localhost' }),
  };
});

const url = 'http://localhost/api/v1/checkout/preview';
const body = { addressId: 7, zoneId: null, couponCode: 'WELCOME10' };
const preview = {
  items: [],
  subtotal: 100,
  couponCode: 'WELCOME10',
  couponDiscount: 10,
  shippingFee: 15,
  freeShippingApplied: false,
  total: 105,
  zone: { id: 1, governorate: 'Cairo', shippingFee: 15, freeShippingThreshold: null },
};

describe('checkout preview', () => {
  it('sends the selection and returns the API values', async () => {
    server.use(
      http.post(url, async ({ request }) => {
        expect(await request.json()).toEqual(body);
        return HttpResponse.json(preview);
      }),
    );
    await expect(previewCheckout(body)).resolves.toEqual(preview);
  });
  it.each([400, 401, 403, 404, 409, 422, 429])('propagates status %i', async (status) => {
    server.use(http.post(url, () => HttpResponse.json({ code: 'checkout_error' }, { status })));
    await expect(previewCheckout(body)).rejects.toMatchObject({ status });
  });
  it.each([
    [404, 'addresses_not_found'],
    [404, 'shipping_zone_not_found'],
    [404, 'coupon_not_found'],
    [409, 'cart_has_unavailable_items'],
    [422, 'cart_empty'],
    [422, 'shipping_zone_unavailable'],
    [422, 'coupon_below_minimum'],
    [422, 'coupon_exceeds_subtotal'],
    [422, 'coupon_exhausted'],
    [422, 'coupon_expired'],
    [422, 'coupon_inactive'],
    [422, 'coupon_not_started'],
    [422, 'coupon_user_limit_reached'],
  ])('preserves %i %s', async (status, code) => {
    server.use(http.post(url, () => HttpResponse.json({ code }, { status })));
    await expect(previewCheckout(body)).rejects.toMatchObject({ status, code });
  });
  it('propagates a network failure', async () => {
    server.use(http.post(url, () => HttpResponse.error()));
    await expect(previewCheckout(body)).rejects.toMatchObject({ kind: 'network' });
  });
});
