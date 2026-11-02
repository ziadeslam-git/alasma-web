import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/mocks/server';
import { createBrowserClient } from '@/shared/lib/api';

const origin = 'http://localhost';
const profile = {
  id: 1,
  fullName: 'Reader',
  email: 'reader@example.com',
  phone: null,
  emailConfirmed: true,
  preferredLanguage: 'ar',
  roles: [],
  permissions: [],
  features: [],
};

describe('account profile endpoint', () => {
  it('reads the current profile through the authenticated browser client', async () => {
    server.use(
      http.get(`${origin}/api/v1/me`, ({ request }) => {
        expect(request.headers.get('Authorization')).toBe('Bearer token');
        return HttpResponse.json(profile);
      }),
    );
    const api = createBrowserClient({ getAccessToken: () => 'token' }, { baseUrl: origin });
    expect((await api.GET('/api/v1/me')).data).toEqual(profile);
  });

  it.each([401, 429])('throws a documented %i response', async (status) => {
    server.use(http.get(`${origin}/api/v1/me`, () => HttpResponse.json({}, { status })));
    const api = createBrowserClient({ getAccessToken: () => 'token' }, { baseUrl: origin });
    await expect(api.GET('/api/v1/me')).rejects.toMatchObject({ status });
  });
});
