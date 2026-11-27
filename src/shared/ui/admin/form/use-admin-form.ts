'use client';

import { useCallback, useRef, useState, type FormEvent } from 'react';

import { getAdminErrorMessage, mapApiError } from '@/shared/lib/api/admin';

import { validateForm, type FormErrors, type FormSchema } from './validation';

export type UseAdminFormOptions<Values extends Record<string, unknown>> = {
  initialValues: Values;
  onSubmit: (values: Values) => Promise<void>;
  schema: FormSchema<Values>;
};

// The state of one admin form: values, a field error per field, a banner for an error that belongs to no field, and a
// submit that checks the schema first and sends only once at a time.
export function useAdminForm<Values extends Record<string, unknown>>({
  initialValues,
  onSubmit,
  schema,
}: UseAdminFormOptions<Values>) {
  const [base, setBase] = useState(initialValues);
  const isInFlightRef = useRef(false);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FormErrors<Values>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = useCallback(
    <Key extends keyof Values & string>(key: Key, value: Values[Key]) => {
      setValues((current) => ({ ...current, [key]: value }));
      // Editing a field clears its own error (client or server): the user is answering it.
      setErrors((current) => {
        if (current[key] === undefined) return current;

        const next = { ...current };

        delete next[key];

        return next;
      });
    },
    [],
  );

  // Turns anything the API call threw into field errors and a banner. A field the form does not have goes to the
  // banner too, so no server message is ever lost.
  const applyServerError = useCallback(
    (cause: unknown) => {
      const mapped = mapApiError(cause);
      const known = new Set(Object.keys(initialValues));
      const fieldErrors: Record<string, string> = {};
      const stray: string[] = [];

      for (const [field, texts] of Object.entries(mapped.fieldErrors)) {
        const text = texts[0];

        if (text === undefined) continue;
        if (known.has(field)) fieldErrors[field] = text;
        else stray.push(text);
      }

      setErrors((current) => ({ ...current, ...fieldErrors }) as FormErrors<Values>);

      const hasFieldErrors = Object.keys(fieldErrors).length > 0;

      if (stray.length > 0) setFormError(stray.join(' '));
      else if (!hasFieldErrors) setFormError(getAdminErrorMessage(mapped.messageKey));
      else setFormError(null);
    },
    [initialValues],
  );

  const handleSubmit = useCallback(
    async (event?: FormEvent) => {
      event?.preventDefault();
      if (isInFlightRef.current) return;

      const found = validateForm(values, schema);

      setErrors(found);
      setFormError(null);
      if (Object.keys(found).length > 0) return;

      isInFlightRef.current = true;
      setIsSubmitting(true);

      try {
        await onSubmit(values);
        setBase(values);
      } catch (cause) {
        applyServerError(cause);
      } finally {
        isInFlightRef.current = false;
        setIsSubmitting(false);
      }
    },
    [applyServerError, onSubmit, schema, values],
  );

  const reset = useCallback(() => {
    setValues(base);
    setErrors({});
    setFormError(null);
  }, [base]);

  const isDirty = JSON.stringify(values) !== JSON.stringify(base);

  return {
    applyServerError,
    errors,
    formError,
    handleSubmit,
    isDirty,
    isSubmitting,
    reset,
    setValue,
    values,
  };
}
