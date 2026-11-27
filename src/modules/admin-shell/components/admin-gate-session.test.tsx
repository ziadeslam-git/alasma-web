import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FakeBroadcastChannel } from '@/test/auth-doubles';

import { server } from '@/mocks/server';
import { AuthProvider } from '@/modules/auth';
import { SESSION_HINT_COOKIE } from '@/modules/auth/auth-constants';
import { resetAuthSessionForTests } from '@/modules/auth/session/auth-session';
import { sessionStore } from '@/modules/auth/session/session-store';

import { AdminGate } from './admin-gate';

const mocks = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin',
  useRouter: () => ({ replace: mocks.replace }),
}));

const origin = globalThis.location.origin;
const clearHint = () => {
  document.cookie = `${SESSION_HINT_COOKIE}=; Path=/; Max-Age=0`;
};

beforeEach(() => {
  vi.stubGlobal('BroadcastChannel', FakeBroadcastChannel);
  FakeBroadcastChannel.instances = [];
  resetAuthSessionForTests();
  sessionStore.clear();
  mocks.replace.mockClear();
  document.cookie = `${SESSION_HINT_COOKIE}=1; Path=/`;
});

afterEach(() => {
  vi.unstubAllGlobals();
  clearHint();
});

describe('AdminGate with the real session layer', () => {
  it('redirects to the login when /me answers 401 and the refresh then fails', async () => {
    let refreshCalls = 0;
    server.use(
      http.post(`${origin}/api/v1/auth/refresh`, () => {
        refreshCalls += 1;

        // the first refresh restores the session; the one after the 401 on /me is dead
        return refreshCalls === 1
          ? HttpResponse.json({
              accessToken: 'test-token-one',
              expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
              user: {},
            })
          : HttpResponse.json(
              { title: 'Unauthorized', code: 'auth_refresh_invalid' },
              { status: 401 },
            );
      }),
      http.get(`${origin}/api/v1/me`, () =>
        HttpResponse.json({ title: 'Unauthorized', code: 'auth_unauthenticated' }, { status: 401 }),
      ),
    );

    render(
      <AuthProvider>
        <AdminGate>
          <p>Secret admin page</p>
        </AdminGate>
      </AuthProvider>,
    );

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/login?next=%2Fadmin'));
    expect(screen.queryByText('Secret admin page')).not.toBeInTheDocument();
    expect(sessionStore.getAccessToken()).toBeNull();
  });
});
