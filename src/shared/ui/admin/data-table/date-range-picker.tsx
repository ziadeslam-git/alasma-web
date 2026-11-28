'use client';

import { useState } from 'react';

import messages from '@/i18n/messages/ar.json';
import { Input } from '@/shared/ui/input';

import styles from './date-range-picker.module.css';

const MS_PER_DAY = 86_400_000;
const copy = messages.admin.table;

export type DateRangeError = 'order' | 'tooLong';

export type DateRangePickerProps = {
  from: string;
  label: string;
  maxDays: number;
  onChange: (range: { from: string; to: string }) => void;
  to: string;
};

function toUtcDay(value: string): number {
  const [year = 0, month = 1, day = 1] = value.split('-').map(Number);

  return Date.UTC(year, month - 1, day);
}

// Both ends included: 2026-01-01 .. 2026-01-01 is one day. Returns null when the range is fine (or open on one end).
export function validateDateRange(
  from: string,
  to: string,
  maxDays: number,
): DateRangeError | null {
  if (!from || !to) return null;

  const days = (toUtcDay(to) - toUtcDay(from)) / MS_PER_DAY + 1;

  if (days < 1) return 'order';

  return days > maxDays ? 'tooLong' : null;
}

export function DateRangePicker({ from, label, maxDays, onChange, to }: DateRangePickerProps) {
  const [draft, setDraft] = useState({ from, to });
  const [syncedFrom, setSyncedFrom] = useState({ from, to });
  const error = validateDateRange(draft.from, draft.to, maxDays);

  // The URL changed from outside (back button, clear): show it, and drop any draft that was blocked.
  // Per field: the echo of a valid `from` must not wipe a `to` the user typed that was blocked and so never reached
  // the URL.
  if (syncedFrom.from !== from || syncedFrom.to !== to) {
    setSyncedFrom({ from, to });
    setDraft((current) => ({
      from: syncedFrom.from !== from ? from : current.from,
      to: syncedFrom.to !== to ? to : current.to,
    }));
  }

  function change(next: { from: string; to: string }) {
    setDraft(next);

    // A blocked range never reaches the URL (and so never the API).
    if (validateDateRange(next.from, next.to, maxDays) === null) onChange(next);
  }

  const message =
    error === 'tooLong'
      ? copy.dateRangeTooLong.replace('{max}', String(maxDays))
      : copy.dateRangeOrder;

  return (
    <fieldset className={styles.range}>
      <legend className={styles.legend}>{label}</legend>
      <Input
        aria-describedby={error ? 'date-range-error' : undefined}
        aria-label={copy.dateFrom}
        error={error !== null}
        lang="ar"
        onChange={(event) => change({ from: event.target.value, to: draft.to })}
        startAdornment={<span className={styles.prefix}>{copy.dateFromShort}</span>}
        type="date"
        value={draft.from}
      />
      <Input
        aria-describedby={error ? 'date-range-error' : undefined}
        aria-label={copy.dateTo}
        error={error !== null}
        lang="ar"
        onChange={(event) => change({ from: draft.from, to: event.target.value })}
        startAdornment={<span className={styles.prefix}>{copy.dateToShort}</span>}
        type="date"
        value={draft.to}
      />
      {error ? (
        <p className={styles.error} id="date-range-error" role="alert">
          {message}
        </p>
      ) : null}
    </fieldset>
  );
}
