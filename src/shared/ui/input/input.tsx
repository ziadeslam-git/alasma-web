'use client';

import type { InputHTMLAttributes, ReactNode } from 'react';

import { useFieldContext } from '@/shared/ui/field/field-context';

import styles from './input.module.css';

export type InputType = 'text' | 'email' | 'password' | 'tel' | 'search' | 'number';

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'type'> & {
  className?: string;
  endAdornment?: ReactNode;
  error?: boolean;
  startAdornment?: ReactNode;
  type?: InputType;
};

export function Input({
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  'aria-required': ariaRequired,
  className,
  endAdornment,
  error = false,
  id,
  startAdornment,
  type = 'text',
  ...props
}: InputProps) {
  const field = useFieldContext();
  const isInvalid =
    error || Boolean(field?.error) || ariaInvalid === true || ariaInvalid === 'true';
  const describedBy = [field?.describedBy, ariaDescribedBy].filter(Boolean).join(' ') || undefined;
  const inputClassName = [styles.input, isInvalid ? styles.error : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={styles.wrapper}>
      {startAdornment ? <span className={styles.startAdornment}>{startAdornment}</span> : null}
      <input
        {...props}
        aria-describedby={describedBy}
        aria-invalid={isInvalid || undefined}
        aria-required={field?.required || ariaRequired}
        className={inputClassName}
        id={id ?? field?.id}
        type={type}
      />
      {endAdornment ? <span className={styles.endAdornment}>{endAdornment}</span> : null}
    </span>
  );
}
