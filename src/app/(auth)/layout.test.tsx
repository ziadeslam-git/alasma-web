import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import AuthLayout from './layout';

vi.mock('@/modules/auth-screens', () => ({
  AuthSplit: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-split">{children}</div>
  ),
}));

describe('auth layout', () => {
  it('puts every auth page inside the split-screen frame (Restyle: auth pages)', () => {
    render(
      <AuthLayout>
        <p>login form</p>
      </AuthLayout>,
    );

    expect(screen.getByTestId('auth-split')).toContainElement(screen.getByText('login form'));
  });
});
