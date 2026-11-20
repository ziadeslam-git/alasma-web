import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { server } from '@/mocks/server';
import { ApiError } from '@/shared/lib/api';
import { AuthTestProvider, createAuthValue, testUser } from '@/test/auth-test-provider';
import { axe } from '@/test/axe';

import { ChangeEmailForm } from './change-email-form';
import { ChangePasswordForm } from './change-password-form';
import { LogoutAllSection } from './logout-all-section';
import { ProfileForm } from './profile-form';

const text = messages.account;
const origin = globalThis.location.origin;
const field = (name: string) => screen.getByLabelText(new RegExp(name));
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }));
const type = (label: string, value: string) =>
  fireEvent.change(field(label), { target: { value } });

describe('ProfileForm', () => {
  it('validates the name and phone before sending anything', () => {
    render(
      <AuthTestProvider>
        <ProfileForm />
      </AuthTestProvider>,
    );
    type(text.name, 'A');
    type(text.phone, '123');
    click(text.save);

    expect(field(text.name)).toHaveAttribute('aria-invalid', 'true');
    expect(field(text.phone)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(2);
  });

  it('saves, replaces the signed-in user and shows the success text, disabled while submitting', async () => {
    const saved = { ...testUser, fullName: 'New Name', phone: '01012345678' };
    let body: unknown;
    server.use(
      http.put(`${origin}/api/v1/me`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(saved);
      }),
    );
    const value = createAuthValue();
    const { container } = render(
      <AuthTestProvider value={value}>
        <ProfileForm />
      </AuthTestProvider>,
    );
    type(text.name, 'New Name');
    type(text.phone, '01012345678');
    click(text.save);

    expect(field(text.name)).toBeDisabled();
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(text.saved));
    expect(body).toEqual({ name: 'New Name', phone: '01012345678', preferredLanguage: 'ar' });
    expect(value.setUser).toHaveBeenCalledWith(saved);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows a per-field server error', async () => {
    server.use(
      http.put(`${origin}/api/v1/me`, () =>
        HttpResponse.json(
          { title: 'Bad', errors: { Phone: ['Phone is taken.'] } },
          { status: 400 },
        ),
      ),
    );
    render(
      <AuthTestProvider>
        <ProfileForm />
      </AuthTestProvider>,
    );
    type(text.name, 'New Name');
    type(text.phone, '01012345678');
    click(text.save);

    expect(await screen.findByText('Phone is taken.')).toBeVisible();
    expect(field(text.phone)).toHaveAttribute('aria-invalid', 'true');
  });
});

describe('ChangeEmailForm', () => {
  const fill = () => {
    type(text.newEmail, 'new@example.com');
    type(text.currentPassword, 'Abcdefgh1x');
  };

  it('requires both fields', () => {
    render(
      <AuthTestProvider>
        <ChangeEmailForm />
      </AuthTestProvider>,
    );
    click(text.changeEmailButton);

    expect(field(text.newEmail)).toHaveAttribute('aria-invalid', 'true');
    expect(field(text.currentPassword)).toHaveAttribute('aria-invalid', 'true');
  });

  it('says a confirmation is needed, keeps the current email, and clears the password', async () => {
    server.use(
      http.post(`${origin}/api/v1/me/email`, () => new HttpResponse(null, { status: 202 })),
    );
    render(
      <AuthTestProvider>
        <ChangeEmailForm />
      </AuthTestProvider>,
    );
    fill();
    click(text.changeEmailButton);

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(text.emailChangeSent));
    expect(screen.getByText(testUser.email)).toBeVisible();
    expect(field(text.currentPassword)).toHaveValue('');
    expect(field(text.newEmail)).toHaveValue('');
  });

  it('maps a wrong current password to its field and clears it', async () => {
    server.use(
      http.post(`${origin}/api/v1/me/email`, () =>
        HttpResponse.json({ code: 'auth_current_password_invalid' }, { status: 400 }),
      ),
    );
    render(
      <AuthTestProvider>
        <ChangeEmailForm />
      </AuthTestProvider>,
    );
    fill();
    click(text.changeEmailButton);

    expect(
      await screen.findByText(messages.apiErrors.codes.auth_current_password_invalid),
    ).toBeVisible();
    expect(field(text.currentPassword)).toHaveValue('');
    expect(field(text.currentPassword)).toHaveAttribute('aria-invalid', 'true');
  });
});

describe('ChangePasswordForm', () => {
  const fill = () => {
    type(text.currentPassword, 'Abcdefgh1x');
    type(messages.auth.newPassword, 'Zyxwvuts9q');
    type(messages.auth.confirmPassword, 'Zyxwvuts9q');
  };

  it('validates the new password rules and the confirmation', () => {
    const value = createAuthValue();
    render(
      <AuthTestProvider value={value}>
        <ChangePasswordForm />
      </AuthTestProvider>,
    );
    type(text.currentPassword, 'Abcdefgh1x');
    type(messages.auth.newPassword, 'short');
    type(messages.auth.confirmPassword, 'other');
    click(text.changePasswordButton);

    expect(field(messages.auth.newPassword)).toHaveAttribute('aria-invalid', 'true');
    expect(field(messages.auth.confirmPassword)).toHaveAttribute('aria-invalid', 'true');
    expect(value.changePassword).not.toHaveBeenCalled();
  });

  it('sends the passwords, shows success and clears every password field', async () => {
    const value = createAuthValue();
    render(
      <AuthTestProvider value={value}>
        <ChangePasswordForm />
      </AuthTestProvider>,
    );
    fill();
    click(text.changePasswordButton);

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(text.passwordChanged));
    expect(value.changePassword).toHaveBeenCalledWith({
      currentPassword: 'Abcdefgh1x',
      newPassword: 'Zyxwvuts9q',
    });
    expect(field(text.currentPassword)).toHaveValue('');
    expect(field(messages.auth.newPassword)).toHaveValue('');
    expect(field(messages.auth.confirmPassword)).toHaveValue('');
  });

  it('maps a wrong current password to its field, with all fields cleared', async () => {
    const value = createAuthValue({
      changePassword: vi
        .fn()
        .mockRejectedValue(
          new ApiError({ kind: 'problem', status: 400, code: 'auth_current_password_invalid' }),
        ),
    });
    render(
      <AuthTestProvider value={value}>
        <ChangePasswordForm />
      </AuthTestProvider>,
    );
    fill();
    click(text.changePasswordButton);

    expect(
      await screen.findByText(messages.apiErrors.codes.auth_current_password_invalid),
    ).toBeVisible();
    expect(field(messages.auth.newPassword)).toHaveValue('');
  });
});

describe('LogoutAllSection', () => {
  it('asks for confirmation, then signs out everywhere', async () => {
    const value = createAuthValue();
    render(
      <AuthTestProvider value={value}>
        <LogoutAllSection />
      </AuthTestProvider>,
    );
    click(text.logoutAll);
    expect(await screen.findByRole('alertdialog')).toBeVisible();
    expect(value.logoutAll).not.toHaveBeenCalled();
    click(text.logoutAllConfirm);

    await waitFor(() => expect(value.logoutAll).toHaveBeenCalledTimes(1));
  });

  it('keeps the dialog open with the error when the call fails', async () => {
    const value = createAuthValue({
      logoutAll: vi.fn().mockRejectedValue(new ApiError({ kind: 'problem', status: 429 })),
    });
    render(
      <AuthTestProvider value={value}>
        <LogoutAllSection />
      </AuthTestProvider>,
    );
    click(text.logoutAll);
    await screen.findByRole('alertdialog');
    click(text.logoutAllConfirm);

    expect(await screen.findByText(messages.apiErrors.status['429'])).toBeVisible();
    expect(screen.getByRole('alertdialog')).toBeVisible();
  });
});
