import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { AuthUser } from '@/modules/auth';
import { axe } from '@/test/axe';

import { ProfileSummary } from './profile-summary';

const user: AuthUser = {
  id: 1,
  fullName: 'Reader One',
  email: 'reader@example.com',
  phone: null,
  emailConfirmed: true,
  preferredLanguage: 'ar',
  roles: [],
  permissions: [],
  features: [],
};

describe('ProfileSummary', () => {
  it('shows the first letter of the name, the name and the email', async () => {
    const { container } = render(<ProfileSummary user={user} />);

    expect(screen.getByText('R')).toBeInTheDocument();
    expect(screen.getByText('Reader One')).toBeInTheDocument();
    expect(screen.getByText('reader@example.com')).toHaveAttribute('dir', 'ltr');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows no initial for a blank name', () => {
    render(<ProfileSummary user={{ ...user, fullName: '  ' }} />);

    expect(screen.queryByText('R')).not.toBeInTheDocument();
  });
});
