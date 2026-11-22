import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { server } from '@/mocks/server';
import { ApiError } from '@/shared/lib/api';

vi.mock('@/modules/auth', async () => {
  const { createBrowserClient } = await import('@/shared/lib/api');
  return {
    getApiClient: () =>
      createBrowserClient({ getAccessToken: () => 'token' }, { baseUrl: 'http://localhost' }),
  };
});
import { requestEmailChange, updateProfile } from './profile-api';

const base = 'http://localhost/api/v1';

describe('profile API: network failure', () => {
  it.each([
    ['update profile', () => updateProfile({ name: 'Name', phone: null, preferredLanguage: 'ar' })],
    [
      'request email change',
      () => requestEmailChange({ newEmail: 'new@example.com', currentPassword: 'x' }),
    ],
  ])('rejects %s with an ApiError of kind network', async (_name, call) => {
    server.use(
      http.put(`${base}/me`, () => HttpResponse.error()),
      http.post(`${base}/me/email`, () => HttpResponse.error()),
    );

    const error = await call().catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).kind).toBe('network');
  });
});
