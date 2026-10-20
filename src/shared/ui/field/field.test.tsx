import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { axe } from '@/test/axe';
import { Input } from '@/shared/ui/input';

import { Field } from './field';

describe('Field and Input', () => {
  it('associates the label and describes the input with hint and error text', () => {
    render(
      <Field
        error="Invalid address"
        hint="We only use this to reply"
        id="email"
        label="Email"
        required
      >
        <Input type="email" />
      </Field>,
    );

    const input = screen.getByLabelText(/^Email/);
    expect(input).toHaveAttribute('aria-describedby', 'email-hint email-error');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid address');
  });

  it('supports a standalone accessible input', () => {
    render(<Input aria-label="Search books" />);

    expect(screen.getByRole('textbox', { name: 'Search books' })).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <Field hint="We only use this to reply" id="email" label="Email" required>
        <Input type="email" />
      </Field>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
