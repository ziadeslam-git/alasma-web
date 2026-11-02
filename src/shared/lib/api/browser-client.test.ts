import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { server } from '@/mocks/server';

import { ApiError } from './api-error';
import { createBrowserClient } from './browser-client';

const base = 'http://localhost';
const emptyBooks = { items: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 0 };

function client(getAccessToken: () => string | null | undefined) {
  const onUnauthorized = vi.fn();
  const api = createBrowserClient({ getAccessToken, onUnauthorized }, { baseUrl: base });

  return { api, onUnauthorized };
}

describe('browser client', () => {
  it('preserves the requested cache mode when applying the timeout', async () => {
    let observedCache: RequestCache | undefined;
    const api = createBrowserClient(
      { getAccessToken: () => null },
      {
        baseUrl: base,
        fetch: async (request) => {
          observedCache = request.cache;
          return Response.json(emptyBooks);
        },
      },
    );
    await api.GET('/api/v1/books', { cache: 'no-store' });
    expect(observedCache).toBe('no-store');
  });
  it('refreshes authentication if a transient retry receives 401', async () => {
    let calls = 0;
    server.use(
      http.post(`${base}/api/v1/cart/items`, () => {
        calls += 1;
        if (calls === 1)
          return HttpResponse.json(
            { code: 'transient_conflict' },
            { status: 409, headers: { 'Retry-After': '0' } },
          );
        if (calls === 2) return new HttpResponse(null, { status: 401 });
        return HttpResponse.json({ items: [], subtotal: 0 }, { status: 201 });
      }),
    );
    const refreshAccessToken = vi.fn().mockResolvedValue('fresh');
    const api = createBrowserClient(
      { getAccessToken: () => 'old', refreshAccessToken },
      { baseUrl: base },
    );
    await api.POST('/api/v1/cart/items', { body: { bookId: 1, bundleId: null, quantity: 1 } });
    expect(calls).toBe(3);
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
  });
  it('retries a transient conflict once with the same body and idempotency key', async () => {
    const seen: { body: unknown; key: string | null }[] = [];
    server.use(
      http.post(`${base}/api/v1/cart/items`, async ({ request }) => {
        seen.push({ body: await request.json(), key: request.headers.get('Idempotency-Key') });
        return seen.length === 1
          ? HttpResponse.json(
              { code: 'transient_conflict' },
              { status: 409, headers: { 'Retry-After': '0' } },
            )
          : HttpResponse.json({ items: [], subtotal: 0 }, { status: 201 });
      }),
    );
    const { api } = client(() => null);
    await api.POST('/api/v1/cart/items', {
      body: { bookId: 1, bundleId: null, quantity: 1 },
      headers: { 'Idempotency-Key': 'test-key' },
    });
    expect(seen).toHaveLength(2);
    expect(seen[1]).toEqual(seen[0]);
  });

  it('does not retry other conflicts', async () => {
    let calls = 0;
    server.use(
      http.post(`${base}/api/v1/cart/items`, () => {
        calls += 1;
        return HttpResponse.json(
          { code: 'stock_insufficient', availableQuantity: 2 },
          { status: 409, headers: { 'Retry-After': '0' } },
        );
      }),
    );
    const { api } = client(() => null);
    const error = await api
      .POST('/api/v1/cart/items', { body: { bookId: 1, bundleId: null, quantity: 3 } })
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).availableQuantity).toBe(2);
    expect(calls).toBe(1);
  });
  it('maps a 400 validation problem to field errors', async () => {
    server.use(
      http.post(`${base}/api/v1/auth/login`, () =>
        HttpResponse.json(
          { title: 'Bad Request', errors: { email: ['required'] } },
          { status: 400 },
        ),
      ),
    );
    const { api } = client(() => null);

    const error = await api
      .POST('/api/v1/auth/login', { body: { email: '', password: '' } })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).errors).toEqual({ email: ['required'] });
  });

  it('keeps the code of a 404 problem', async () => {
    server.use(
      http.get(`${base}/api/v1/books/missing`, () =>
        HttpResponse.json({ title: 'Not Found', code: 'catalog_book_not_found' }, { status: 404 }),
      ),
    );
    const { api } = client(() => null);

    const error = await api
      .GET('/api/v1/books/{slug}', { params: { path: { slug: 'missing' } } })
      .catch((caught: unknown) => caught);

    expect((error as ApiError).code).toBe('catalog_book_not_found');
    expect((error as ApiError).status).toBe(404);
  });

  it('handles a non-JSON 500 body', async () => {
    server.use(
      http.get(`${base}/api/v1/books`, () => new HttpResponse('Internal error', { status: 500 })),
    );
    const { api } = client(() => null);

    const error = await api.GET('/api/v1/books').catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(500);
    expect((error as ApiError).code).toBeUndefined();
  });

  it('reads Retry-After on a 429', async () => {
    server.use(
      http.get(`${base}/api/v1/books`, () =>
        HttpResponse.json(
          { title: 'Too Many Requests' },
          { status: 429, headers: { 'Retry-After': '9' } },
        ),
      ),
    );
    const { api } = client(() => null);

    const error = await api.GET('/api/v1/books').catch((caught: unknown) => caught);

    expect((error as ApiError).retryAfterSeconds).toBe(9);
  });

  it('turns a network failure into kind network', async () => {
    server.use(http.get(`${base}/api/v1/books`, () => HttpResponse.error()));
    const { api } = client(() => null);

    const error = await api.GET('/api/v1/books').catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).kind).toBe('network');
  });

  it('turns a slow response into kind timeout', async () => {
    server.use(
      http.get(`${base}/api/v1/books`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 300));

        return HttpResponse.json(emptyBooks);
      }),
    );
    const api = createBrowserClient(
      { getAccessToken: () => null },
      { baseUrl: base, timeoutMs: 20 },
    );

    const error = await api.GET('/api/v1/books').catch((caught: unknown) => caught);

    expect((error as ApiError).kind).toBe('timeout');
  });

  it('calls onUnauthorized exactly once for a 401 and does not retry', async () => {
    let calls = 0;
    server.use(
      http.get(`${base}/api/v1/me`, () => {
        calls += 1;

        return HttpResponse.json({ title: 'Unauthorized' }, { status: 401 });
      }),
    );
    const { api, onUnauthorized } = client(() => 'stale');

    const error = await api.GET('/api/v1/me').catch((caught: unknown) => caught);

    expect((error as ApiError).status).toBe(401);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(calls).toBe(1);
  });

  it('does not call onUnauthorized for other errors', async () => {
    server.use(
      http.get(`${base}/api/v1/me`, () =>
        HttpResponse.json({ title: 'Forbidden' }, { status: 403 }),
      ),
    );
    const { api, onUnauthorized } = client(() => 'token');

    await api.GET('/api/v1/me').catch(() => undefined);

    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('adds the Authorization header when the getter returns a token', async () => {
    let header: string | null = 'unset';
    server.use(
      http.get(`${base}/api/v1/books`, ({ request }) => {
        header = request.headers.get('Authorization');

        return HttpResponse.json(emptyBooks);
      }),
    );
    const { api } = client(() => 'abc.def');

    await api.GET('/api/v1/books');

    expect(header).toBe('Bearer abc.def');
  });

  it('omits the Authorization header when the getter returns nothing', async () => {
    let header: string | null = 'unset';
    server.use(
      http.get(`${base}/api/v1/books`, ({ request }) => {
        header = request.headers.get('Authorization');

        return HttpResponse.json(emptyBooks);
      }),
    );
    const { api } = client(() => null);

    const result = await api.GET('/api/v1/books');

    expect(header).toBeNull();
    expect(result.data).toEqual(emptyBooks);
  });

  it('sends typed query parameters', async () => {
    let url = '';
    server.use(
      http.get(`${base}/api/v1/books`, ({ request }) => {
        url = request.url;

        return HttpResponse.json(emptyBooks);
      }),
    );
    const { api } = client(() => null);

    await api.GET('/api/v1/books', {
      params: { query: { q: 'x', category: 'novels', page: 2, sort: 'price_asc' } },
    });

    const query = new URL(url).searchParams;
    expect([query.get('category'), query.get('sort'), query.get('page')]).toEqual([
      'novels',
      'price_asc',
      '2',
    ]);
  });
});
