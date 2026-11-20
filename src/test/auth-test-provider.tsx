import type { ReactNode } from 'react';
import { vi } from 'vitest';

import { AuthContext, type AuthContextValue } from '@/modules/auth/auth-context';
import type { AuthUser } from '@/modules/auth';

export const testUser: AuthUser = {
  id: 1,
  fullName: 'Reader',
  email: 'reader@example.com',
  phone: null,
  emailConfirmed: false,
  preferredLanguage: 'ar',
  roles: [],
  permissions: [],
  features: [],
};

// A signed-in auth context for component tests: the actions are spies, nothing touches the network.
export function createAuthValue(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    changePassword: vi.fn().mockResolvedValue(undefined),
    login: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined),
    logoutAll: vi.fn().mockResolvedValue(undefined),
    setUser: vi.fn(),
    status: 'authenticated',
    user: testUser,
    ...overrides,
  };
}

export function AuthTestProvider({
  children,
  value = createAuthValue(),
}: Readonly<{ children: ReactNode; value?: AuthContextValue }>) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
