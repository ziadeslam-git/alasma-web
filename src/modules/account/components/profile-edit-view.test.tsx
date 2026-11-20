import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { FeatureFlagsProvider, resolveFeatureFlags } from '@/shared/config/feature-flags';
import { AuthTestProvider } from '@/test/auth-test-provider';

import { ProfileEditView } from './profile-edit-view';

const text = messages.account;

describe('ProfileEditView and the email-change flag (Task 88b)', () => {
  it('hides the change-email section while email-change is soon, and keeps the other sections', () => {
    const { container } = render(
      <AuthTestProvider>
        <ProfileEditView />
      </AuthTestProvider>,
    );

    expect(screen.queryByRole('heading', { name: text.emailSection })).toBeNull();
    expect(screen.queryByLabelText(new RegExp(text.newEmail))).toBeNull();
    expect(container.querySelector('[data-feature="email-change"]')).toBeNull();
    expect(screen.getByRole('heading', { name: text.profileSection })).toBeVisible();
    expect(screen.getByRole('heading', { name: text.passwordSection })).toBeVisible();
    expect(screen.getByRole('heading', { name: text.sessionsSection })).toBeVisible();
  });

  it('shows the change-email section once email-change is live', () => {
    render(
      <FeatureFlagsProvider value={{ ...resolveFeatureFlags(null), 'email-change': 'live' }}>
        <AuthTestProvider>
          <ProfileEditView />
        </AuthTestProvider>
      </FeatureFlagsProvider>,
    );

    expect(screen.getByRole('heading', { name: text.emailSection })).toBeVisible();
    expect(screen.getByLabelText(new RegExp(text.newEmail))).toBeVisible();
  });
});
