'use client';

import { createContext } from 'react';

import type { AuthStatus, AuthUser, ChangePasswordRequest, LoginCredentials } from './types';

export type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  // Signs in and returns the loaded user (the caller can check emailConfirmed). Throws an ApiError (wrong credentials,
  // validation, rate limit, network).
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  // Always ends the session locally, even when the API call fails.
  logout: () => Promise<void>;
  // Ends every session of the user on every device. Unlike logout it THROWS an ApiError when the API call fails, so
  // the caller never tells the user that all sessions ended when they did not. On success the local session ends too.
  logoutAll: () => Promise<void>;
  // Needs the current password (a wrong one is 400 auth_current_password_invalid). The API ends the other sessions and
  // answers a new access token, which replaces the one in memory. Throws an ApiError.
  changePassword: (request: ChangePasswordRequest) => Promise<void>;
  // Replaces the signed-in user, for example with the answer of PUT /me.
  setUser: (user: AuthUser) => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
