import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { server } from '@/mocks/server';

import { ApiError } from './api-error';
import { createBrowserClient } from './browser-client';

const base = 'http://localhost';
const unauthorized = () =>
  HttpResponse.json({ title: 'Unauthorized', code: 'auth_unauthorized' }, { status: 401 });

function setup(
  refreshAccessToken: (info: { staleToken: string | null }) => Promise<string | null>,
) {
  let token: string | null = 'old';
  const onUnauthorized = vi.fn();
  const refresh = vi.fn(async (info: { staleToken: string | null }) => {
    const fresh = await refreshAccessToken(info);

    if (fresh) {
      token = fresh;
    }

    return fresh;
  });
  const api = createBrowserClient(
    { getAccessToken: () => token, onUnauthorized, refreshAccessToken: refresh },
    { baseUrl: base },
  );

  return { api, onUnauthorized, refresh };
}

describe('browser client refresh on 401', () => {
  it('refreshes once on a normal route and retries once with the new token and the same body', async () => {
    const seen: { auth: string | null; body: unknown }[] = [];
    server.use(
      http.post(`${base}/api/v1/orders/checkout`, async ({ request }) => {
        seen.push({ auth: request.headers.get('authorization'), body: await request.json() });

        return seen.length === 1 ? unauthorized() : HttpResponse.json({ ok: true });
      }),
    );
    const { api, onUnauthorized, refresh } = setup(async () => 'new');

    // the path is not in the generated schema on purpose: only the middleware behaviour is under test
    const result = await (
      api as unknown as { POST: (path: string, init: object) => Promise<{ data: unknown }> }
    ).POST('/api/v1/orders/checkout', { body: { note: 'x' } });

    expect(result.data).toEqual({ ok: true });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledWith({ staleToken: 'old' });
    expect(seen).toEqual([
      { auth: 'Bearer old', body: { note: 'x' } },
      { auth: 'Bearer new', body: { note: 'x' } },
    ]);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('clears the session and throws when the retry gets a second 401, with no third request', async () => {
    let calls = 0;
    server.use(
      http.get(`${base}/api/v1/me`, () => {
        calls += 1;

        return unauthorized();
      }),
    );
    const { api, onUnauthorized, refresh } = setup(async () => 'new');

    const error = await api.GET('/api/v1/me').catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(401);
    expect(calls).toBe(2);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('throws the original 401 and ends the session when the refresh gives no token', async () => {
    let calls = 0;
    server.use(
      http.get(`${base}/api/v1/me`, () => {
        calls += 1;

        return unauthorized();
      }),
    );
    const { api, onUnauthorized } = setup(async () => null);

    await expect(api.GET('/api/v1/me')).rejects.toMatchObject({ status: 401 });

    expect(calls).toBe(1);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it.each([
    '/api/v1/auth/login',
    '/api/v1/auth/register',
    '/api/v1/auth/refresh',
    '/api/v1/auth/logout',
    '/api/v1/auth/forgot-password',
    '/api/v1/auth/reset-password',
    '/api/v1/auth/confirm-email',
  ])('never refreshes for %s', async (path) => {
    let calls = 0;
    server.use(
      http.post(`${base}${path}`, () => {
        calls += 1;

        return unauthorized();
      }),
    );
    const { api, onUnauthorized, refresh } = setup(async () => 'new');

    await expect(
      (api as unknown as { POST: (route: string, init: object) => Promise<unknown> }).POST(path, {
        body: {},
      }),
    ).rejects.toMatchObject({ status: 401 });

    expect(calls).toBe(1);
    expect(refresh).not.toHaveBeenCalled();
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('does not refresh for other statuses', async () => {
    server.use(
      http.get(`${base}/api/v1/me`, () =>
        HttpResponse.json({ title: 'Forbidden' }, { status: 403 }),
      ),
    );
    const { api, refresh } = setup(async () => 'new');

    await expect(api.GET('/api/v1/me')).rejects.toMatchObject({ status: 403 });

    expect(refresh).not.toHaveBeenCalled();
  });
});
