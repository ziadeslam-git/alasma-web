'use client';

import type { SelectHTMLAttributes } from 'react';

import { useFieldContext } from '@/shared/ui/field/field-context';

import styles from './input.module.css';

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> & {
  className?: string;
  error?: boolean;
};

export function Select({
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  'aria-required': ariaRequired,
  children,
  className,
  error = false,
  id,
  ...props
}: SelectProps) {
  const field = useFieldContext();
  const isInvalid =
    error || Boolean(field?.error) || ariaInvalid === true || ariaInvalid === 'true';
  const describedBy = [field?.describedBy, ariaDescribedBy].filter(Boolean).join(' ') || undefined;
  const selectClassName = [styles.input, styles.select, isInvalid ? styles.error : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <select
      {...props}
      aria-describedby={describedBy}
      aria-invalid={isInvalid || undefined}
      aria-required={field?.required || ariaRequired}
      className={selectClassName}
      id={id ?? field?.id}
    >
      {children}
    </select>
  );
}
