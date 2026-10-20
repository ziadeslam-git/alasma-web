import { act, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { useEffect } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FakeBroadcastChannel } from '@/test/auth-doubles';

import { server } from '@/mocks/server';
import { ApiError } from '@/shared/lib/api';

import { getApiClient } from '../api/auth-client';
import { SESSION_HINT_COOKIE } from '../auth-constants';
import { useAuth } from '../hooks/use-auth';
import { resetAuthSessionForTests } from '../session/auth-session';
import { sessionStore } from '../session/session-store';
import type { AuthContextValue } from '../auth-context';
import { AuthProvider } from './auth-provider';

const origin = globalThis.location.origin;
const secretToken = 'secret-access-token-value';
const expiresAt = () => new Date(Date.now() + 5 * 60 * 1000).toISOString();

const me = (fullName = 'Test Reader') => ({
  email: 'reader@example.test',
  emailConfirmed: true,
  features: [],
  fullName,
  id: 7,
  permissions: [],
  phone: null,
  preferredLanguage: 'ar',
  roles: ['Customer'],
});

const authBody = (token = secretToken) => ({
  accessToken: token,
  expiresAt: expiresAt(),
  user: {
    email: 'reader@example.test',
    emailConfirmed: true,
    fullName: 'Test Reader',
    id: 7,
    roles: ['Customer'],
  },
});

let auth: AuthContextValue;

function Probe() {
  const value = useAuth();
  // the tests call login() and logout() on the latest context value
  useEffect(() => {
    auth = value;
  });
  const { status, user } = value;

  return <p>{`${status}:${user?.fullName ?? '-'}`}</p>;
}

const mount = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );

const hasHint = () => document.cookie.includes(`${SESSION_HINT_COOKIE}=1`);
const setHint = () => {
  document.cookie = `${SESSION_HINT_COOKIE}=1; Path=/`;
};
const clearHint = () => {
  document.cookie = `${SESSION_HINT_COOKIE}=; Path=/; Max-Age=0`;
};

type Seen = { method: string; path: string; auth: string | null };

function track(seen: Seen[]) {
  server.events.on('request:start', ({ request }) => {
    seen.push({
      auth: request.headers.get('authorization'),
      method: request.method,
      path: new URL(request.url).pathname,
    });
  });
}

const refreshOk = (token = secretToken) =>
  http.post(`${origin}/api/v1/auth/refresh`, () => HttpResponse.json(authBody(token)));
const meOk = http.get(`${origin}/api/v1/me`, () => HttpResponse.json(me()));
const unauthorized = (code = 'auth_unauthorized') =>
  HttpResponse.json({ title: 'Unauthorized', code }, { status: 401 });

beforeEach(() => {
  vi.stubGlobal('BroadcastChannel', FakeBroadcastChannel);
  FakeBroadcastChannel.instances = [];
  resetAuthSessionForTests();
  sessionStore.clear();
  clearHint();
});

afterEach(() => {
  server.events.removeAllListeners();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  clearHint();
});

describe('AuthProvider', () => {
  it('is loading in the server render and the first client render', () => {
    setHint();
    const html = renderToString(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    expect(html).toContain('loading:-');
  });

  it('is loading until the session is restored when a hint exists', async () => {
    setHint();
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.use(
      refreshOk(),
      http.get(`${origin}/api/v1/me`, async () => {
        await gate;

        return HttpResponse.json(me());
      }),
    );
    mount();

    expect(screen.getByText('loading:-')).toBeInTheDocument();
    release();
    expect(await screen.findByText('authenticated:Test Reader')).toBeInTheDocument();
  });

  it('calls nothing when there is no hint', async () => {
    const seen: Seen[] = [];
    track(seen);
    mount();

    expect(await screen.findByText('anonymous:-')).toBeInTheDocument();
    expect(seen).toEqual([]);
  });

  it('refreshes and then loads /me when the hint exists', async () => {
    const seen: Seen[] = [];
    track(seen);
    setHint();
    server.use(refreshOk('restored-token'), meOk);
    mount();

    expect(await screen.findByText('authenticated:Test Reader')).toBeInTheDocument();
    expect(seen).toEqual([
      { auth: null, method: 'POST', path: '/api/v1/auth/refresh' },
      { auth: 'Bearer restored-token', method: 'GET', path: '/api/v1/me' },
    ]);
  });

  it('clears the session, the hint and the token when the refresh fails', async () => {
    setHint();
    server.use(
      http.post(`${origin}/api/v1/auth/refresh`, () => unauthorized('auth_refresh_invalid')),
    );
    mount();

    expect(await screen.findByText('anonymous:-')).toBeInTheDocument();
    expect(hasHint()).toBe(false);
    expect(sessionStore.getAccessToken()).toBeNull();
  });

  it('logs in, loads /me, writes the hint and tells the other tabs', async () => {
    server.use(
      http.post(`${origin}/api/v1/auth/login`, () => HttpResponse.json(authBody())),
      meOk,
    );
    const otherTab = new FakeBroadcastChannel('alasma-auth');
    const heard: unknown[] = [];
    otherTab.addEventListener('message', (event) => heard.push(event.data));
    mount();
    await screen.findByText('anonymous:-');

    await act(() => auth.login({ email: 'reader@example.test', password: 'not-a-real-password' }));

    expect(screen.getByText('authenticated:Test Reader')).toBeInTheDocument();
    expect(hasHint()).toBe(true);
    await waitFor(() => expect(heard).toHaveLength(1));
    expect(heard[0]).toMatchObject({ type: 'session', accessToken: secretToken });
  });

  it('does not refresh on a 401 from login and exposes the ApiError', async () => {
    const seen: Seen[] = [];
    track(seen);
    server.use(
      http.post(`${origin}/api/v1/auth/login`, () => unauthorized('auth_invalid_credentials')),
    );
    mount();
    await screen.findByText('anonymous:-');

    let error: unknown;
    await act(async () => {
      error = await auth
        .login({ email: 'a@b.test', password: 'x' })
        .catch((caught: unknown) => caught);
    });

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe('auth_invalid_credentials');
    expect(seen.map((entry) => entry.path)).toEqual(['/api/v1/auth/login']);
    expect(screen.getByText('anonymous:-')).toBeInTheDocument();
  });

  it('logs out: calls the API, clears everything and tells the other tabs', async () => {
    setHint();
    server.use(
      refreshOk(),
      meOk,
      http.post(`${origin}/api/v1/auth/logout`, () => new HttpResponse(null, { status: 204 })),
    );
    const otherTab = new FakeBroadcastChannel('alasma-auth');
    const heard: unknown[] = [];
    otherTab.addEventListener('message', (event) => heard.push(event.data));
    mount();
    await screen.findByText('authenticated:Test Reader');

    await act(() => auth.logout());

    expect(screen.getByText('anonymous:-')).toBeInTheDocument();
    expect(sessionStore.getAccessToken()).toBeNull();
    expect(hasHint()).toBe(false);
    await waitFor(() => expect(heard).toContainEqual({ type: 'logout' }));
  });

  it('logs out locally even when the API call fails', async () => {
    setHint();
    server.use(
      refreshOk(),
      meOk,
      http.post(`${origin}/api/v1/auth/logout`, () => HttpResponse.error()),
    );
    mount();
    await screen.findByText('authenticated:Test Reader');

    await act(() => auth.logout());

    expect(screen.getByText('anonymous:-')).toBeInTheDocument();
    expect(hasHint()).toBe(false);
  });

  it('becomes anonymous when another tab logs out', async () => {
    setHint();
    server.use(refreshOk(), meOk);
    const otherTab = new FakeBroadcastChannel('alasma-auth');
    mount();
    await screen.findByText('authenticated:Test Reader');

    act(() => otherTab.postMessage({ type: 'logout' }));

    expect(await screen.findByText('anonymous:-')).toBeInTheDocument();
    expect(sessionStore.getAccessToken()).toBeNull();
  });

  it('loads the user when another tab signs in', async () => {
    server.use(meOk);
    const otherTab = new FakeBroadcastChannel('alasma-auth');
    mount();
    await screen.findByText('anonymous:-');

    act(() =>
      otherTab.postMessage({
        type: 'session',
        accessToken: 'from-tab',
        expiresAt: Date.now() + 300_000,
      }),
    );

    expect(await screen.findByText('authenticated:Test Reader')).toBeInTheDocument();
  });

  it('refreshes once and retries once on a 401 from a normal route, then clears the session on a second 401', async () => {
    const seen: Seen[] = [];
    track(seen);
    setHint();
    let accountCalls = 0;
    server.use(
      refreshOk('second-token'),
      meOk,
      http.get(`${origin}/api/v1/me/orders`, () => {
        accountCalls += 1;

        return accountCalls === 1 ? unauthorized() : HttpResponse.json({ items: [] });
      }),
    );
    mount();
    await screen.findByText('authenticated:Test Reader');
    seen.length = 0;

    const get = getApiClient() as unknown as { GET: (path: string) => Promise<unknown> };
    await get.GET('/api/v1/me/orders');

    expect(seen.map((entry) => `${entry.method} ${entry.path}`)).toEqual([
      'GET /api/v1/me/orders',
      'POST /api/v1/auth/refresh',
      'GET /api/v1/me/orders',
    ]);

    server.use(http.get(`${origin}/api/v1/me/orders`, () => unauthorized()));
    seen.length = 0;

    await expect(get.GET('/api/v1/me/orders')).rejects.toMatchObject({ status: 401 });

    expect(seen.filter((entry) => entry.path === '/api/v1/auth/refresh')).toHaveLength(1);
    await waitFor(() => expect(screen.getByText('anonymous:-')).toBeInTheDocument());
    expect(sessionStore.getAccessToken()).toBeNull();
    expect(hasHint()).toBe(false);
  });

  it('never writes the token to web storage or a cookie; only the hint cookie is written', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const cookieWrites: string[] = [];
    const descriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () => descriptor?.get?.call(document) as string,
      set: (value: string) => {
        cookieWrites.push(value);
        descriptor?.set?.call(document, value);
      },
    });
    server.use(
      http.post(`${origin}/api/v1/auth/login`, () => HttpResponse.json(authBody())),
      meOk,
      http.post(`${origin}/api/v1/auth/logout`, () => new HttpResponse(null, { status: 204 })),
    );
    mount();
    await screen.findByText('anonymous:-');

    await act(() => auth.login({ email: 'reader@example.test', password: 'not-a-real-password' }));
    await act(() => auth.logout());

    delete (document as { cookie?: string }).cookie;
    expect(setItem).not.toHaveBeenCalled();
    expect(globalThis.localStorage.length).toBe(0);
    expect(globalThis.sessionStorage.length).toBe(0);
    expect(cookieWrites.length).toBeGreaterThan(0);
    for (const write of cookieWrites) {
      expect(write.startsWith(`${SESSION_HINT_COOKIE}=`)).toBe(true);
      expect(write).not.toContain(secretToken);
    }
  });
});
