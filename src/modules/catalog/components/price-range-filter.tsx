'use client';

import { useRef, useState, type KeyboardEvent } from 'react';

import messages from '@/i18n/messages/ar.json';
import { Field } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';

import { orderPriceRange, sanitizePrice } from '../url/catalog-params';
import styles from './price-range-filter.module.css';

// How long to wait after the last keystroke before the range is applied (blur and Enter apply at once).
export const PRICE_DEBOUNCE_MS = 400;

export type PriceRange = { minPrice: number | undefined; maxPrice: number | undefined };

export type PriceRangeFilterProps = {
  // 0 applies on every valid change (the mobile sheet keeps a draft, so nothing navigates until "apply").
  debounceMs?: number;
  maxPrice: number | undefined;
  minPrice: number | undefined;
  onApply: (range: PriceRange) => void;
};

type PriceErrors = { min?: string; max?: string };

const formatPrice = (price: number | undefined) => (price === undefined ? '' : String(price));

// Two numeric fields. They validate before anything leaves: an invalid range shows the Arabic error and never
// reaches the URL. The typed text is the only local state; the applied range comes back through the props.
export function PriceRangeFilter({
  debounceMs = PRICE_DEBOUNCE_MS,
  maxPrice,
  minPrice,
  onApply,
}: PriceRangeFilterProps) {
  const text = messages.catalog.filters;
  const [minText, setMinText] = useState(formatPrice(minPrice));
  const [maxText, setMaxText] = useState(formatPrice(maxPrice));
  const [errors, setErrors] = useState<PriceErrors>({});
  const [seen, setSeen] = useState({ minPrice, maxPrice });
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // The range changed from outside (another control, "clear all", back button): show the new numbers.
  if (seen.minPrice !== minPrice || seen.maxPrice !== maxPrice) {
    setSeen({ minPrice, maxPrice });
    if (sanitizePrice(minText) !== minPrice) setMinText(formatPrice(minPrice));
    if (sanitizePrice(maxText) !== maxPrice) setMaxText(formatPrice(maxPrice));
    setErrors({});
  }

  function apply(nextMin: string, nextMax: string) {
    clearTimeout(timer.current);

    const parsedMin = nextMin.trim() === '' ? undefined : sanitizePrice(nextMin);
    const parsedMax = nextMax.trim() === '' ? undefined : sanitizePrice(nextMax);
    const nextErrors: PriceErrors = {};
    if (nextMin.trim() !== '' && parsedMin === undefined) nextErrors.min = text.errors.priceInvalid;
    if (nextMax.trim() !== '' && parsedMax === undefined) nextErrors.max = text.errors.priceInvalid;
    if (
      !nextErrors.min &&
      !nextErrors.max &&
      parsedMin !== undefined &&
      parsedMax !== undefined &&
      parsedMin > parsedMax
    ) {
      nextErrors.max = text.errors.priceRange;
    }

    setErrors(nextErrors);
    if (nextErrors.min || nextErrors.max) return;

    const range = orderPriceRange(parsedMin, parsedMax);
    if (range.minPrice === minPrice && range.maxPrice === maxPrice) return;
    onApply({ minPrice: range.minPrice, maxPrice: range.maxPrice });
  }

  function change(nextMin: string, nextMax: string) {
    setMinText(nextMin);
    setMaxText(nextMax);
    clearTimeout(timer.current);
    if (debounceMs <= 0) {
      apply(nextMin, nextMax);
      return;
    }
    timer.current = setTimeout(() => apply(nextMin, nextMax), debounceMs);
  }

  function applyOnEnter(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    apply(minText, maxText);
  }

  return (
    <div className={styles.row}>
      <Field error={errors.min} label={text.groups.priceMin}>
        <Input
          className={styles.input}
          inputMode="decimal"
          onBlur={() => apply(minText, maxText)}
          onChange={(event) => change(event.target.value, maxText)}
          onKeyDown={applyOnEnter}
          value={minText}
        />
      </Field>
      <Field error={errors.max} label={text.groups.priceMax}>
        <Input
          className={styles.input}
          inputMode="decimal"
          onBlur={() => apply(minText, maxText)}
          onChange={(event) => change(minText, event.target.value)}
          onKeyDown={applyOnEnter}
          value={maxText}
        />
      </Field>
    </div>
  );
}
