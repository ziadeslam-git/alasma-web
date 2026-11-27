'use client';

import { useState, type ChangeEvent } from 'react';

import messages from '@/i18n/messages/ar.json';
import { formatMoney } from '@/shared/lib/format';
import { Input } from '@/shared/ui/input';

import styles from './form.module.css';

const copy = messages.admin.form;
const ARABIC_INDIC_ZERO = 0x0660;
const PERSIAN_ZERO = 0x06f0;
const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/;

function toLatinDigits(text: string): string {
  return text
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - ARABIC_INDIC_ZERO))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - PERSIAN_ZERO))
    .replace(/[٫]/g, '.')
    .replace(/[٬,\s]/g, '');
}

// The number the user typed, exactly as typed: null for an empty box, 'invalid' for anything that is not a plain
// amount with at most two decimals. Nothing is rounded or calculated here.
export function parseMoney(text: string): number | null | 'invalid' {
  const clean = toLatinDigits(text.trim());

  if (clean === '') return null;

  return MONEY_PATTERN.test(clean) ? Number(clean) : 'invalid';
}

export type MoneyInputProps = {
  onChange: (value: number | null) => void;
  value: number | null;
  id?: string;
  isDisabled?: boolean;
};

// The value is a number. While the box is being edited it shows the raw text; when it loses focus a valid amount is
// shown with formatMoney (Latin digits, the site currency).
export function MoneyInput({ id, isDisabled = false, onChange, value }: MoneyInputProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const [isInvalid, setIsInvalid] = useState(false);

  const shown = draft ?? (value === null ? '' : formatMoney(value));

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const text = event.target.value;
    const parsed = parseMoney(text);

    setDraft(text);
    setIsInvalid(parsed === 'invalid');
    if (parsed !== 'invalid') onChange(parsed);
  };

  const handleFocus = () => {
    if (draft === null) setDraft(value === null ? '' : String(value));
  };

  const handleBlur = () => {
    if (!isInvalid) setDraft(null);
  };

  return (
    <>
      <Input
        aria-invalid={isInvalid || undefined}
        disabled={isDisabled}
        id={id}
        inputMode="decimal"
        value={shown}
        onBlur={handleBlur}
        onChange={handleChange}
        onFocus={handleFocus}
      />
      {isInvalid ? (
        <p className={styles.inlineError} role="alert">
          {copy.moneyInvalid}
        </p>
      ) : null}
    </>
  );
}
