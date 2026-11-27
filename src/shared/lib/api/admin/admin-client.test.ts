import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { server } from '@/mocks/server';

import { createAdminClient, createCorrelationId } from './admin-client';

const base = 'http://localhost';
const ADMIN_ORDERS = '/api/v1/admin/orders';
const CORRELATION_ID_PATTERN = /^[A-Za-z0-9_.-]{1,64}$/;
const problem = (status: number, body: object) => HttpResponse.json(body, { status });

type LooseClient = { GET: (path: string, init?: object) => Promise<{ data: unknown }> };

describe('createCorrelationId', () => {
  it('makes ids the API accepts (1 to 64 letters, digits, _ . -)', () => {
    const ids = new Set([createCorrelationId(), createCorrelationId(), createCorrelationId()]);

    expect(ids.size).toBe(3);
    for (const id of ids) expect(id).toMatch(CORRELATION_ID_PATTERN);
  });
});

describe('admin client', () => {
  it('sends the bearer token, credentials and a correlation id', async () => {
    const seen: { auth: string | null; id: string | null; credentials: string }[] = [];
    const api = createAdminClient(
      { getAccessToken: () => 'tok' },
      {
        baseUrl: base,
        fetch: async (request) => {
          seen.push({
            auth: request.headers.get('authorization'),
            id: request.headers.get('x-correlation-id'),
            credentials: request.credentials,
          });

          return Response.json({ items: [] });
        },
      },
    );

    await (api as unknown as LooseClient).GET(ADMIN_ORDERS);

    expect(seen).toHaveLength(1);
    expect(seen[0]?.auth).toBe('Bearer tok');
    expect(seen[0]?.id).toMatch(CORRELATION_ID_PATTERN);
    expect(seen[0]?.credentials).toBe('include');
  });

  it('uses a new correlation id for each call', async () => {
    const ids: (string | null)[] = [];
    server.use(
      http.get(`${base}${ADMIN_ORDERS}`, ({ request }) => {
        ids.push(request.headers.get('x-correlation-id'));

        return HttpResponse.json({ items: [] });
      }),
    );
    const api = createAdminClient({ getAccessToken: () => null }, { baseUrl: base });

    await (api as unknown as LooseClient).GET(ADMIN_ORDERS);
    await (api as unknown as LooseClient).GET(ADMIN_ORDERS);

    expect(ids[0]).not.toBeNull();
    expect(ids[0]).not.toBe(ids[1]);
  });

  it('calls onForbidden for a 403 and still throws the ApiError with the correlation id', async () => {
    server.use(
      http.get(`${base}${ADMIN_ORDERS}`, () =>
        HttpResponse.json(
          { title: 'Forbidden', status: 403, code: 'forbidden', correlationId: 'abc-123' },
          { status: 403 },
        ),
      ),
    );
    const onForbidden = vi.fn();
    const api = createAdminClient({ getAccessToken: () => 'tok', onForbidden }, { baseUrl: base });

    await expect((api as unknown as LooseClient).GET(ADMIN_ORDERS)).rejects.toMatchObject({
      status: 403,
      code: 'forbidden',
      correlationId: 'abc-123',
    });
    expect(onForbidden).toHaveBeenCalledTimes(1);
  });

  it('keeps the 401 behaviour: one refresh, one retry with the new token and the same correlation id', async () => {
    const seen: { auth: string | null; id: string | null }[] = [];
    server.use(
      http.get(`${base}${ADMIN_ORDERS}`, ({ request }) => {
        seen.push({
          auth: request.headers.get('authorization'),
          id: request.headers.get('x-correlation-id'),
        });

        return seen.length === 1
          ? problem(401, { title: 'Unauthorized', code: 'auth_unauthenticated' })
          : HttpResponse.json({ items: [] });
      }),
    );
    let token = 'old';
    const refreshAccessToken = vi.fn(async () => {
      token = 'new';

      return token;
    });
    const api = createAdminClient(
      { getAccessToken: () => token, refreshAccessToken },
      { baseUrl: base },
    );

    await (api as unknown as LooseClient).GET(ADMIN_ORDERS);

    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(seen.map((entry) => entry.auth)).toEqual(['Bearer old', 'Bearer new']);
    expect(seen[0]?.id).not.toBeNull();
    expect(seen[1]?.id).toBe(seen[0]?.id);
  });

  it('reads the correlation id from the response header when the body has none', async () => {
    server.use(
      http.get(`${base}${ADMIN_ORDERS}`, () =>
        HttpResponse.json(
          { title: 'Server error', status: 500 },
          { status: 500, headers: { 'X-Correlation-Id': 'from-header' } },
        ),
      ),
    );
    const api = createAdminClient({ getAccessToken: () => 'tok' }, { baseUrl: base });

    await expect((api as unknown as LooseClient).GET(ADMIN_ORDERS)).rejects.toMatchObject({
      status: 500,
      correlationId: 'from-header',
    });
  });
});
