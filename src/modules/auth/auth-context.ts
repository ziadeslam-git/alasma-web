'use client';

import { createContext } from 'react';

import type { AuthStatus, AuthUser, LoginCredentials } from './types';

export type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  // Signs in and returns the loaded user (the caller can check emailConfirmed). Throws an ApiError (wrong credentials,
  // validation, rate limit, network).
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  // Always ends the session locally, even when the API call fails.
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
