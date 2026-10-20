import { useId, type ReactNode } from 'react';

import { FieldProvider } from './field-context';
import styles from './field.module.css';

export type FieldProps = {
  children: ReactNode;
  error?: string;
  hint?: string;
  id?: string;
  label: string;
  required?: boolean;
};

export function Field({ children, error, hint, id, label, required = false }: FieldProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <FieldProvider value={{ describedBy, error, id: controlId, required }}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor={controlId}>
          {label}
          {required ? (
            <span aria-hidden="true" className={styles.required}>
              {' '}
              *
            </span>
          ) : null}
        </label>
        {children}
        {hint ? (
          <p className={styles.hint} id={hintId}>
            {hint}
          </p>
        ) : null}
        {error ? (
          <p className={styles.error} id={errorId} role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </FieldProvider>
  );
}
