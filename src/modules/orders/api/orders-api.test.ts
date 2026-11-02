import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '@/mocks/server';
import { ApiError } from '@/shared/lib/api';

const cacheModes = vi.hoisted(() => [] as string[]);

vi.mock('@/modules/auth', async () => {
  const { createBrowserClient } = await import('@/shared/lib/api');
  return {
    getApiClient: () =>
      createBrowserClient(
        { getAccessToken: () => 'token' },
        {
          baseUrl: 'http://localhost',
          // MSW rebuilds the Request, so its handlers always see cache "default". The mode the client really
          // sends is observable only here, as in browser-client.test.ts.
          fetch: (request) => {
            cacheModes.push(`${request.method} ${new URL(request.url).pathname}: ${request.cache}`);
            return globalThis.fetch(request);
          },
        },
      ),
  };
});
import {
  cancelOrder,
  getOrder,
  isOrderId,
  listOrders,
  listOrderZones,
  updateOrder,
} from './orders-api';

const base = 'http://localhost/api/v1';
const id = '12345678-1234-1234-1234-123456789abc';
const body = {
  rowVersion: 'AA==',
  recipientName: null,
  phone: null,
  addressFields: null,
  zoneId: null,
  notes: null,
};
describe('orders API', () => {
  beforeEach(() => {
    cacheModes.length = 0;
  });
  it('recognises GUIDs before a details request', () => {
    expect(isOrderId(id)).toBe(true);
    expect(isOrderId('not-a-guid')).toBe(false);
  });
  it('lists orders with the documented page size and fetches shipping zones', async () => {
    server.use(
      http.get(`${base}/orders`, ({ request }) => {
        expect(new URL(request.url).searchParams.get('pageSize')).toBe('48');
        return HttpResponse.json({ items: [], page: 1, pageSize: 48, totalCount: 0 });
      }),
      http.get(`${base}/shipping/zones`, () => HttpResponse.json([])),
    );
    expect((await listOrders(1)).items).toEqual([]);
    expect(await listOrderZones()).toEqual([]);
    expect(cacheModes).toEqual([
      'GET /api/v1/orders: no-store',
      'GET /api/v1/shipping/zones: no-store',
    ]);
  });
  it('reads, updates and cancels using their documented routes', async () => {
    server.use(
      http.get(`${base}/orders/:id`, () => HttpResponse.json({ id })),
      http.put(`${base}/orders/:id`, () => HttpResponse.json({ id })),
      http.post(`${base}/orders/:id/cancel`, () => HttpResponse.json({ id })),
    );
    expect((await getOrder(id)).id).toBe(id);
    expect((await updateOrder(id, body)).id).toBe(id);
    expect((await cancelOrder(id)).id).toBe(id);
    expect(cacheModes).toEqual([
      `GET /api/v1/orders/${id}: no-store`,
      `PUT /api/v1/orders/${id}: no-store`,
      `POST /api/v1/orders/${id}/cancel: no-store`,
    ]);
  });
  it('omits unchanged null fields and preserves an empty string when editing', async () => {
    let received: unknown;
    server.use(
      http.put(`${base}/orders/:id`, async ({ request }) => {
        received = await request.json();
        return HttpResponse.json({ id });
      }),
    );
    await updateOrder(id, {
      ...body,
      notes: '',
      addressFields: { city: null, addressLine: null, landmark: '' },
    });
    expect(received).toEqual({ rowVersion: 'AA==', notes: '', addressFields: { landmark: '' } });
  });
  it('reloads the order after a successful mutation without a response body', async () => {
    server.use(
      http.put(`${base}/orders/:id`, () => new HttpResponse(null, { status: 204 })),
      http.post(`${base}/orders/:id/cancel`, () => new HttpResponse(null, { status: 204 })),
      http.get(`${base}/orders/:id`, () => HttpResponse.json({ id })),
    );
    expect((await updateOrder(id, body)).id).toBe(id);
    expect((await cancelOrder(id)).id).toBe(id);
  });
  for (const status of [400, 401, 403, 404, 409, 422, 429, 500]) {
    it(`propagates HTTP ${status}, including empty errors`, async () => {
      server.use(http.get(`${base}/orders/:id`, () => new HttpResponse(null, { status })));
      expect(await getOrder(`${status}-${id}`).catch((error: unknown) => error)).toBeInstanceOf(
        ApiError,
      );
    });
  }
  it('propagates network errors', async () => {
    server.use(http.get(`${base}/orders/:id`, () => HttpResponse.error()));
    expect(await getOrder(id).catch((error: unknown) => error)).toBeInstanceOf(ApiError);
  });
  for (const status of [400, 401, 403, 429]) {
    it(`propagates list HTTP ${status}`, async () => {
      server.use(http.get(`${base}/orders`, () => new HttpResponse(null, { status })));
      expect(await listOrders(1).catch((error: unknown) => error)).toBeInstanceOf(ApiError);
    });
  }
  for (const status of [400, 401, 403, 404, 409, 422, 429]) {
    it(`propagates edit HTTP ${status}`, async () => {
      server.use(http.put(`${base}/orders/:id`, () => new HttpResponse(null, { status })));
      expect(await updateOrder(id, body).catch((error: unknown) => error)).toBeInstanceOf(ApiError);
    });
    it(`propagates cancel HTTP ${status}`, async () => {
      server.use(http.post(`${base}/orders/:id/cancel`, () => new HttpResponse(null, { status })));
      expect(await cancelOrder(id).catch((error: unknown) => error)).toBeInstanceOf(ApiError);
    });
  }
  it('propagates the shipping-zone rate limit', async () => {
    server.use(http.get(`${base}/shipping/zones`, () => new HttpResponse(null, { status: 429 })));
    expect(await listOrderZones().catch((error: unknown) => error)).toBeInstanceOf(ApiError);
  });
});
