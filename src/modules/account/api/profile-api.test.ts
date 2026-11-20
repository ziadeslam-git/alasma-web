import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/mocks/server';
import { ApiError } from '@/shared/lib/api';

import { requestEmailChange, updateProfile } from './profile-api';

const origin = globalThis.location.origin;
const profile = {
  id: 1,
  fullName: 'New Name',
  email: 'reader@example.com',
  phone: '01012345678',
  emailConfirmed: true,
  preferredLanguage: 'ar',
  roles: [],
  permissions: [],
  features: [],
};
const request = { name: 'New Name', phone: '01012345678', preferredLanguage: 'ar' };

describe('updateProfile (PUT /me)', () => {
  it('sends exactly the request body and returns the updated profile', async () => {
    let body: unknown;
    server.use(
      http.put(`${origin}/api/v1/me`, async ({ request: incoming }) => {
        body = await incoming.json();
        return HttpResponse.json(profile);
      }),
    );

    expect(await updateProfile(request)).toEqual(profile);
    expect(body).toEqual(request);
  });

  it('throws the 400 validation problem with its field errors', async () => {
    server.use(
      http.put(`${origin}/api/v1/me`, () =>
        HttpResponse.json(
          { title: 'Bad Request', errors: { Phone: ['Invalid phone.'] } },
          { status: 400 },
        ),
      ),
    );

    const error = await updateProfile(request).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, errors: { Phone: ['Invalid phone.'] } });
  });

  it.each([401, 413, 429])('throws the documented %i response', async (status) => {
    server.use(http.put(`${origin}/api/v1/me`, () => HttpResponse.json({}, { status })));

    await expect(updateProfile(request)).rejects.toMatchObject({ status });
  });
});

describe('requestEmailChange (POST /me/email)', () => {
  const body = { newEmail: 'new@example.com', currentPassword: 'Abcdefgh1x' };

  it('resolves on 202 with an empty body and sends the new address and the password', async () => {
    let sent: unknown;
    server.use(
      http.post(`${origin}/api/v1/me/email`, async ({ request: incoming }) => {
        sent = await incoming.json();
        return new HttpResponse(null, { status: 202 });
      }),
    );

    await expect(requestEmailChange(body)).resolves.toBeUndefined();
    expect(sent).toEqual(body);
  });

  it('throws 400 auth_current_password_invalid for a wrong current password', async () => {
    server.use(
      http.post(`${origin}/api/v1/me/email`, () =>
        HttpResponse.json(
          { title: 'Bad Request', code: 'auth_current_password_invalid' },
          { status: 400 },
        ),
      ),
    );

    await expect(requestEmailChange(body)).rejects.toMatchObject({
      status: 400,
      code: 'auth_current_password_invalid',
    });
  });

  it.each([401, 413, 429])('throws the documented %i response', async (status) => {
    server.use(http.post(`${origin}/api/v1/me/email`, () => HttpResponse.json({}, { status })));

    await expect(requestEmailChange(body)).rejects.toMatchObject({ status });
  });
});
