import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { Field } from '@/shared/ui/field';
import { axe } from '@/test/axe';

import { PasswordInput } from './password-input';

const text = messages.auth;
const user = userEvent.setup({ delay: null });

function renderField(props: { disabled?: boolean; onSubmit?: () => void } = {}) {
  return render(
    <form
      onSubmit={(event) => {
        event.preventDefault();
        props.onSubmit?.();
      }}
    >
      <Field label={text.password}>
        <PasswordInput defaultValue="Secret12345" disabled={props.disabled} name="password" />
      </Field>
    </form>,
  );
}

const input = () => screen.getByLabelText(text.password, { selector: 'input' });
const toggle = () => screen.getByRole('button', { name: /كلمة المرور$/ });

describe('PasswordInput', () => {
  it('starts hidden with a "show" button that is not pressed', () => {
    renderField();

    expect(input()).toHaveAttribute('type', 'password');
    expect(toggle()).toHaveAccessibleName(text.showPassword);
    expect(toggle()).toHaveAttribute('aria-pressed', 'false');
    expect(toggle()).toHaveAttribute('type', 'button');
  });

  it('switches the input type, aria-pressed and the Arabic label on each click', async () => {
    renderField();

    await user.click(toggle());

    expect(input()).toHaveAttribute('type', 'text');
    expect(toggle()).toHaveAccessibleName(text.hidePassword);
    expect(toggle()).toHaveAttribute('aria-pressed', 'true');

    await user.click(toggle());

    expect(input()).toHaveAttribute('type', 'password');
    expect(toggle()).toHaveAccessibleName(text.showPassword);
    expect(toggle()).toHaveAttribute('aria-pressed', 'false');
  });

  it('works from the keyboard and never submits the form', async () => {
    const onSubmit = vi.fn();
    renderField({ onSubmit });

    toggle().focus();
    await user.keyboard('{Enter}');
    expect(input()).toHaveAttribute('type', 'text');
    await user.keyboard(' ');
    expect(input()).toHaveAttribute('type', 'password');

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('keeps the typed value when toggling', async () => {
    renderField();

    await user.click(toggle());

    expect(input()).toHaveValue('Secret12345');
  });

  it('does not take the focus away from the input on a mouse click', async () => {
    renderField();

    input().focus();
    await user.click(toggle());

    expect(input()).toHaveFocus();
  });

  it('disables the toggle together with the input', () => {
    renderField({ disabled: true });

    expect(toggle()).toBeDisabled();
  });

  it('has no accessibility violations in either state', async () => {
    const { container } = renderField();

    expect(await axe(container)).toHaveNoViolations();

    await user.click(toggle());

    expect(await axe(container)).toHaveNoViolations();
  });
});
