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
const address = { ...input, id: 1, governorateName: 'Zone', isDefault: true };
describe('address API', () => {
  it('uses the address and zone endpoints', async () => {
    server.use(
      http.get(`${base}/me/addresses`, () => HttpResponse.json([address])),
      http.post(`${base}/me/addresses`, () => HttpResponse.json(address, { status: 201 })),
      http.get(`${base}/me/addresses/:id`, () => HttpResponse.json(address)),
      http.put(`${base}/me/addresses/:id`, () => HttpResponse.json(address)),
      http.delete(`${base}/me/addresses/:id`, () => new HttpResponse(null, { status: 204 })),
      http.put(`${base}/me/addresses/:id/default`, () => new HttpResponse(null, { status: 204 })),
      http.get(`${base}/shipping/zones`, () => HttpResponse.json([])),
    );
    expect(await listAddresses()).toEqual([address]);
    expect(await getAddress(1)).toEqual(address);
    expect((await createAddress(input)).data).toEqual(address);
    expect((await updateAddress(1, input)).data).toEqual(address);
    await expect(deleteAddress(1)).resolves.toBeDefined();
    await expect(setDefaultAddress(1)).resolves.toBeDefined();
    expect(await listShippingZones()).toEqual([]);
  });
  it.each([400, 401, 404, 422, 429])(
    'throws API errors for rejected address updates (%i)',
    async (status) => {
      server.use(
        http.put(`${base}/me/addresses/:id`, () =>
          HttpResponse.json({ title: 'Failed', status }, { status }),
        ),
      );
      await expect(updateAddress(1, input)).rejects.toBeInstanceOf(ApiError);
    },
  );

  const failures = [
    ['list', [401, 429]],
    ['create', [400, 401, 422, 429]],
    ['get', [400, 401, 404, 429]],
    ['delete', [400, 401, 404, 429]],
    ['default', [400, 401, 404, 429]],
    ['zones', [429]],
  ] as const;
  for (const [operation, statuses] of failures) {
    it.each(statuses)(`${operation} propagates documented HTTP %i`, async (status) => {
      const reject = () => HttpResponse.json({ title: 'Failed', status }, { status });
      server.use(
        http.get(`${base}/me/addresses`, reject),
        http.post(`${base}/me/addresses`, reject),
        http.get(`${base}/me/addresses/:id`, reject),
        http.delete(`${base}/me/addresses/:id`, reject),
        http.put(`${base}/me/addresses/:id/default`, reject),
        http.get(`${base}/shipping/zones`, reject),
      );
      const call = {
        list: () => listAddresses(),
        create: () => createAddress(input),
        get: () => getAddress(1),
        delete: () => deleteAddress(1),
        default: () => setDefaultAddress(1),
        zones: () => listShippingZones(),
      }[operation];
      await expect(call()).rejects.toMatchObject({ status });
    });
  }
});
