'use client';

import type { TextareaHTMLAttributes } from 'react';

import { useFieldContext } from '@/shared/ui/field/field-context';

import styles from './input.module.css';

export type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> & {
  className?: string;
  error?: boolean;
};

export function Textarea({
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  'aria-required': ariaRequired,
  className,
  error = false,
  id,
  ...props
}: TextareaProps) {
  const field = useFieldContext();
  const isInvalid =
    error || Boolean(field?.error) || ariaInvalid === true || ariaInvalid === 'true';
  const describedBy = [field?.describedBy, ariaDescribedBy].filter(Boolean).join(' ') || undefined;
  const textareaClassName = [
    styles.input,
    styles.textarea,
    isInvalid ? styles.error : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <textarea
      {...props}
      aria-describedby={describedBy}
      aria-invalid={isInvalid || undefined}
      aria-required={field?.required || ariaRequired}
      className={textareaClassName}
      id={id ?? field?.id}
    />
  );
}
