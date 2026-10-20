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
