import { ApiError, type createBrowserClient } from '@/shared/lib/api';

import type { ChangePasswordRequest, LoginCredentials, RegisterCredentials } from '../types';

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
    // Ends every session of the caller (all refresh tokens). 204; a 401 means the session was already gone.
    async logoutAll() {
      await client.POST('/api/v1/auth/logout-all');
    },
    // The current password is required. The API ends every OTHER session and answers a fresh access token (the new
    // refresh cookie is set by the API), exactly like a login.
    async changePassword(body: ChangePasswordRequest) {
      const { data } = await client.POST('/api/v1/auth/change-password', { body });

      return requireBody(data);
    },
    // Anonymous endpoint: 202 with no body whatever the address.
    async resendConfirmation(email: string) {
      await client.POST('/api/v1/auth/resend-confirmation', { body: { email } });
    },
    async me() {
      const { data } = await client.GET('/api/v1/me', { cache: 'no-store' });

      return requireBody(data);
    },
    async refresh() {
      const { data } = await client.POST('/api/v1/auth/refresh');

      return requireBody(data);
    },
  };
}

export type AuthApi = ReturnType<typeof createAuthApi>;
