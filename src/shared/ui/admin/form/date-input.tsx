'use client';

import messages from '@/i18n/messages/ar.json';
import { Input } from '@/shared/ui/input';

import styles from './form.module.css';

const copy = messages.admin.form;

export type DateInputMode = 'date' | 'datetime';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

// A value from the box: '' (empty), 2026-01-31 for a date, 2026-01-31T18:30 for a date with time.
export function isValidDateValue(value: string, mode: DateInputMode): boolean {
  return (mode === 'date' ? DATE_PATTERN : DATE_TIME_PATTERN).test(value);
}

export type DateInputProps = {
  mode: DateInputMode;
  onChange: (value: string) => void;
  value: string;
  id?: string;
  isDisabled?: boolean;
  // A date without time that ends something (a coupon): the API reads it as the end of that day in Cairo, so the
  // box says so.
  isEndOfDay?: boolean;
};

export function DateInput({
  id,
  isDisabled = false,
  isEndOfDay = false,
  mode,
  onChange,
  value,
}: DateInputProps) {
  return (
    <>
      <Input
        disabled={isDisabled}
        id={id}
        type={mode === 'date' ? 'date' : 'datetime-local'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {mode === 'date' && isEndOfDay ? <p className={styles.note}>{copy.endOfDayNote}</p> : null}
    </>
  );
}
