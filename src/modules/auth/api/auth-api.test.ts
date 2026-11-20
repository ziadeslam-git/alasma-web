import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/mocks/server';
import { ApiError, createBrowserClient } from '@/shared/lib/api';

import type { RegisterCredentials } from '../types';
import { createAuthApi } from './auth-api';

const origin = 'http://localhost';
const api = createAuthApi(createBrowserClient({ getAccessToken: () => null }, { baseUrl: origin }));
const credentials: RegisterCredentials = {
  email: 'reader@example.com',
  fullName: 'Test Reader',
  password: 'Abcdefgh1x',
  phone: '01012345678',
};

describe('auth api register', () => {
  it('posts exactly the generated request body and returns the response', async () => {
    let body: unknown;
    server.use(
      http.post(`${origin}/api/v1/auth/register`, async ({ request }) => {
        body = await request.json();

        return HttpResponse.json(
          { email: credentials.email, emailConfirmed: false, userId: 4 },
          { status: 201 },
        );
      }),
    );

    const result = await api.register(credentials);

    expect(body).toEqual(credentials);
    expect(result).toEqual({ email: credentials.email, emailConfirmed: false, userId: 4 });
  });

  it('throws the 409 email-taken problem as an ApiError', async () => {
    server.use(
      http.post(`${origin}/api/v1/auth/register`, () =>
        HttpResponse.json({ title: 'Conflict', code: 'auth_email_taken' }, { status: 409 }),
      ),
    );

    const error = await api.register(credentials).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ code: 'auth_email_taken', status: 409 });
  });

  it('throws the 400 validation problem with its field errors', async () => {
    server.use(
      http.post(`${origin}/api/v1/auth/register`, () =>
        HttpResponse.json(
          {
            title: 'Bad Request',
            errors: { Phone: ['The phone must be an Egyptian mobile number.'] },
          },
          { status: 400 },
        ),
      ),
    );

    const error = await api.register(credentials).catch((caught: unknown) => caught);

    expect(error).toMatchObject({ status: 400 });
    expect((error as ApiError).errors).toEqual({
      Phone: ['The phone must be an Egyptian mobile number.'],
    });
  });
});

describe('auth api logout-all, change-password and resend-confirmation (Task 88)', () => {
  const session = {
    accessToken: 'new-token',
    expiresAt: '2099-01-01T00:00:00Z',
    user: { email: 'a@b.test', emailConfirmed: true, fullName: 'A', id: 1, roles: [] },
  };
  const change = { currentPassword: 'Abcdefgh1x', newPassword: 'Zyxwvuts9q' };

  it('logoutAll posts to /auth/logout-all and accepts 204', async () => {
    server.use(
      http.post(`${origin}/api/v1/auth/logout-all`, () => new HttpResponse(null, { status: 204 })),
    );

    await expect(api.logoutAll()).resolves.toBeUndefined();
  });

  it.each([401, 429])('logoutAll throws the documented %i response', async (status) => {
    server.use(
      http.post(`${origin}/api/v1/auth/logout-all`, () => HttpResponse.json({}, { status })),
    );

    await expect(api.logoutAll()).rejects.toMatchObject({ status });
  });

  it('changePassword sends both passwords and returns the new session', async () => {
    let body: unknown;
    server.use(
      http.post(`${origin}/api/v1/auth/change-password`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(session);
      }),
    );

    expect(await api.changePassword(change)).toEqual(session);
    expect(body).toEqual(change);
  });

  it('changePassword throws 400 auth_current_password_invalid', async () => {
    server.use(
      http.post(`${origin}/api/v1/auth/change-password`, () =>
        HttpResponse.json({ code: 'auth_current_password_invalid' }, { status: 400 }),
      ),
    );

    await expect(api.changePassword(change)).rejects.toMatchObject({
      code: 'auth_current_password_invalid',
      status: 400,
    });
  });

  it.each([401, 409, 413, 429])(
    'changePassword throws the documented %i response',
    async (status) => {
      server.use(
        http.post(`${origin}/api/v1/auth/change-password`, () => HttpResponse.json({}, { status })),
      );

      await expect(api.changePassword(change)).rejects.toMatchObject({ status });
    },
  );

  it('resendConfirmation posts the email and accepts 202', async () => {
    let body: unknown;
    server.use(
      http.post(`${origin}/api/v1/auth/resend-confirmation`, async ({ request }) => {
        body = await request.json();
        return new HttpResponse(null, { status: 202 });
      }),
    );

    await expect(api.resendConfirmation('a@b.test')).resolves.toBeUndefined();
    expect(body).toEqual({ email: 'a@b.test' });
  });

  it.each([400, 413, 429])(
    'resendConfirmation throws the documented %i response',
    async (status) => {
      server.use(
        http.post(`${origin}/api/v1/auth/resend-confirmation`, () =>
          HttpResponse.json({}, { status }),
        ),
      );

      await expect(api.resendConfirmation('a@b.test')).rejects.toMatchObject({ status });
    },
  );
});
