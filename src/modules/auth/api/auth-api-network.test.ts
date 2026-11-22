import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/mocks/server';
import { ApiError, createBrowserClient } from '@/shared/lib/api';

import { createAuthApi } from './auth-api';

const origin = 'http://localhost';
const api = createAuthApi(
  createBrowserClient({ getAccessToken: () => 'token' }, { baseUrl: origin }),
);

describe('auth API: network failure', () => {
  it.each([
    ['login', () => api.login({ email: 'a@example.com', password: 'x' })],
    [
      'register',
      () =>
        api.register({
          email: 'a@example.com',
          fullName: 'Name',
          password: 'Abcdefgh1x',
          phone: '01012345678',
        }),
    ],
    ['logout', () => api.logout()],
    ['logout everywhere', () => api.logoutAll()],
    [
      'change password',
      () => api.changePassword({ currentPassword: 'x', newPassword: 'Abcdefgh1x' }),
    ],
    ['resend confirmation', () => api.resendConfirmation('a@example.com')],
    ['me', () => api.me()],
    ['refresh', () => api.refresh()],
  ])('rejects %s with an ApiError of kind network', async (_name, call) => {
    server.use(
      http.post(`${origin}/api/v1/auth/login`, () => HttpResponse.error()),
      http.post(`${origin}/api/v1/auth/register`, () => HttpResponse.error()),
      http.post(`${origin}/api/v1/auth/logout`, () => HttpResponse.error()),
      http.post(`${origin}/api/v1/auth/logout-all`, () => HttpResponse.error()),
      http.post(`${origin}/api/v1/auth/change-password`, () => HttpResponse.error()),
      http.post(`${origin}/api/v1/auth/resend-confirmation`, () => HttpResponse.error()),
      http.get(`${origin}/api/v1/me`, () => HttpResponse.error()),
      http.post(`${origin}/api/v1/auth/refresh`, () => HttpResponse.error()),
    );

    const error = await call().catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).kind).toBe('network');
  });
});
