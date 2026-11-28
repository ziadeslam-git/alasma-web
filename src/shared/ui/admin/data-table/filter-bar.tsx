'use client';

import { useEffect, useRef, useState } from 'react';

import messages from '@/i18n/messages/ar.json';
import { Button } from '@/shared/ui/button';
import { Icon } from '@/shared/ui/icon';
import { Input, Select } from '@/shared/ui/input';

import { DateRangePicker } from './date-range-picker';
import styles from './filter-bar.module.css';
import { filterKeys } from './table-state';
import type { FilterDef, SelectFilterDef, TextFilterDef } from './types';

export const SEARCH_DEBOUNCE_MS = 300;
const copy = messages.admin.table;

export type FilterBarProps = {
  filters: readonly FilterDef[];
  onChange: (patch: Record<string, string | null>) => void;
  values: Record<string, string>;
};

type TextFilterProps = {
  filter: TextFilterDef;
  onChange: FilterBarProps['onChange'];
  value: string;
};

// Typing is local; the URL (and so the API) is written once, 300ms after the last keystroke.
function TextFilter({ filter, onChange, value }: TextFilterProps) {
  const [text, setText] = useState(value);
  const [syncedValue, setSyncedValue] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (syncedValue !== value) {
    setSyncedValue(value);
    setText(value);
  }

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function change(next: string) {
    setText(next);

    if (timer.current) clearTimeout(timer.current);

    timer.current = setTimeout(
      () => onChange({ [filter.key]: next.trim() || null }),
      SEARCH_DEBOUNCE_MS,
    );
  }

  return (
    <div className={styles.search}>
      <Input
        aria-label={filter.label}
        onChange={(event) => change(event.target.value)}
        placeholder={filter.placeholder ?? copy.searchPlaceholder}
        startAdornment={<Icon name="search" size="sm" />}
        type="search"
        value={text}
      />
    </div>
  );
}

function SelectFilter({
  filter,
  onChange,
  value,
}: {
  filter: SelectFilterDef;
  onChange: FilterBarProps['onChange'];
  value: string;
}) {
  return (
    <Select
      aria-label={filter.label}
      className={styles.select}
      onChange={(event) => onChange({ [filter.key]: event.target.value || null })}
      value={value}
    >
      <option value="">{filter.label}</option>
      {filter.options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  );
}

export function FilterBar({ filters, onChange, values }: FilterBarProps) {
  const hasActive = filterKeys(filters).some((key) => Boolean(values[key]));

  function clear() {
    onChange(Object.fromEntries(filterKeys(filters).map((key) => [key, null])));
  }

  return (
    <div aria-label={copy.filters} className={styles.bar} role="search">
      {filters.map((filter) => {
        if (filter.type === 'text') {
          return (
            <TextFilter
              key={filter.key}
              filter={filter}
              onChange={onChange}
              value={values[filter.key] ?? ''}
            />
          );
        }

        if (filter.type === 'dateRange') {
          return (
            <DateRangePicker
              key={filter.fromKey}
              from={values[filter.fromKey] ?? ''}
              label={filter.label}
              maxDays={filter.maxDays}
              onChange={(range) =>
                onChange({ [filter.fromKey]: range.from || null, [filter.toKey]: range.to || null })
              }
              to={values[filter.toKey] ?? ''}
            />
          );
        }

        return (
          <SelectFilter
            key={filter.key}
            filter={filter}
            onChange={onChange}
            value={values[filter.key] ?? ''}
          />
        );
      })}
      {hasActive ? (
        <Button onClick={clear} size="sm" variant="ghost">
          {copy.clearFilters}
        </Button>
      ) : null}
    </div>
  );
}
