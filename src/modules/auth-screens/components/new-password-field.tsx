'use client';

import { useId } from 'react';

import { Field } from '@/shared/ui/field';

import { PasswordInput } from './password-input';
import { PasswordRequirements } from './password-requirements';

export type NewPasswordFieldProps = {
  disabled: boolean;
  error: string | undefined;
  label: string;
  onChange: (value: string) => void;
  value: string;
};

// The "new password" field of the register and reset forms: the show/hide input plus the live rules checklist,
// which replaces the old static hint line. The input is described by the checklist.
export function NewPasswordField({
  disabled,
  error,
  label,
  onChange,
  value,
}: NewPasswordFieldProps) {
  const requirementsId = useId();

  return (
    <Field error={error} label={label} required>
      <PasswordInput
        aria-describedby={requirementsId}
        autoComplete="new-password"
        disabled={disabled}
        name="password"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
      <PasswordRequirements id={requirementsId} password={value} />
    </Field>
  );
}
