import { ApiError, type createBrowserClient } from '@/shared/lib/api';

import type { LoginCredentials, RegisterCredentials } from '../types';

type BrowserClient = ReturnType<typeof createBrowserClient>;

// The client throws for every non-2xx response, so a missing body here means the API broke its contract.
function requireBody<T>(data: T | undefined): T {
  if (data === undefined) {
    throw new ApiError({ kind: 'unknown', detail: 'The API returned no body.' });
  }

  return data;
}

// The four auth calls, typed from the generated schema. Every failure is thrown as an ApiError by the client.
export function createAuthApi(client: BrowserClient) {
  return {
    async login(credentials: LoginCredentials) {
      const { data } = await client.POST('/api/v1/auth/login', { body: credentials });

      return requireBody(data);
    },
    async register(credentials: RegisterCredentials) {
      const { data } = await client.POST('/api/v1/auth/register', { body: credentials });

      return requireBody(data);
    },
    async logout() {
      await client.POST('/api/v1/auth/logout');
    },
    async me() {
      const { data } = await client.GET('/api/v1/me');

      return requireBody(data);
    },
    async refresh() {
      const { data } = await client.POST('/api/v1/auth/refresh');

      return requireBody(data);
    },
  };
}

export type AuthApi = ReturnType<typeof createAuthApi>;
