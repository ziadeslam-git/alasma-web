import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { server } from '@/mocks/server';
import { ApiError } from '@/shared/lib/api';

vi.mock('@/modules/auth', async () => {
  const { createBrowserClient } = await import('@/shared/lib/api');
  const client = createBrowserClient(
    { getAccessToken: () => 'test' },
    { baseUrl: 'http://localhost:5198' },
  );
  return { getApiClient: () => client };
});
import {
  createAddress,
  deleteAddress,
  getAddress,
  listAddresses,
  listShippingZones,
  setDefaultAddress,
  updateAddress,
} from './addresses';

const base = 'http://localhost:5198/api/v1';
const input = {
  recipientName: 'Name',
  phone: '01012345678',
  shippingZoneId: 1,
  city: 'City',
  addressLine: 'Street',
  landmark: null,
};

// A dropped connection must reach the caller as an ApiError of kind "network" for every address call.
describe('address API: network failure', () => {
  it.each([
    ['list', () => listAddresses()],
    ['get', () => getAddress(1)],
    ['create', () => createAddress(input)],
    ['update', () => updateAddress(1, input)],
    ['delete', () => deleteAddress(1)],
    ['set default', () => setDefaultAddress(1)],
    ['zones', () => listShippingZones()],
  ])('rejects %s with an ApiError of kind network', async (_name, call) => {
    server.use(
      http.get(`${base}/me/addresses`, () => HttpResponse.error()),
      http.post(`${base}/me/addresses`, () => HttpResponse.error()),
      http.get(`${base}/me/addresses/:id`, () => HttpResponse.error()),
      http.put(`${base}/me/addresses/:id`, () => HttpResponse.error()),
      http.delete(`${base}/me/addresses/:id`, () => HttpResponse.error()),
      http.put(`${base}/me/addresses/:id/default`, () => HttpResponse.error()),
      http.get(`${base}/shipping/zones`, () => HttpResponse.error()),
    );

    const error = await call().catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).kind).toBe('network');
  });
});
