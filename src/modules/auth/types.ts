import type { components } from '@/shared/lib/api';

export type LoginCredentials = components['schemas']['LoginCommand'];
export type RegisterCredentials = components['schemas']['RegisterCommand'];
export type RegisterResult = components['schemas']['RegisterResponse'];
export type AuthUser = components['schemas']['MeResponse'];
export type AuthSession = components['schemas']['AuthResponse'];

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';
