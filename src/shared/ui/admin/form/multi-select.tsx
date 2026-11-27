'use client';

import { useId, useMemo, useState } from 'react';

import messages from '@/i18n/messages/ar.json';
import { Icon } from '@/shared/ui/icon';
import { Input } from '@/shared/ui/input';

import styles from './form.module.css';

const copy = messages.admin.form;

export type MultiSelectOption = { label: string; value: string };

export type MultiSelectProps = {
  onChange: (value: string[]) => void;
  options: readonly MultiSelectOption[];
  value: readonly string[];
  id?: string;
  isDisabled?: boolean;
  // The contract caps some lists (for example the authors of a book): past it the other boxes are disabled.
  maxSelected?: number;
};

// Many values from a list that can be searched. The chosen ones show as chips that can be removed; the list below is
// a group of real checkboxes, so keyboard and screen readers work without extra roles.
export function MultiSelect({
  id,
  isDisabled = false,
  maxSelected,
  onChange,
  options,
  value,
}: MultiSelectProps) {
  const groupId = useId();
  const [query, setQuery] = useState('');
  const chosen = useMemo(() => new Set(value), [value]);
  const labels = useMemo(
    () => new Map(options.map((option) => [option.value, option.label])),
    [options],
  );
  const visible = options.filter((option) => option.label.includes(query.trim()));
  const isFull = maxSelected !== undefined && value.length >= maxSelected;

  const toggle = (optionValue: string) => {
    onChange(
      chosen.has(optionValue)
        ? value.filter((item) => item !== optionValue)
        : [...value, optionValue],
    );
  };

  return (
    <div className={styles.multi}>
      {value.length > 0 ? (
        <ul aria-label={copy.selectedLabel} className={styles.chips}>
          {value.map((item) => (
            <li key={item} className={styles.chip}>
              <span>{labels.get(item) ?? item}</span>
              <button
                aria-label={copy.removeItem.replace('{name}', labels.get(item) ?? item)}
                className={styles.chipRemove}
                disabled={isDisabled}
                type="button"
                onClick={() => toggle(item)}
              >
                <Icon name="x" size="sm" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <Input
        disabled={isDisabled}
        id={id}
        placeholder={copy.searchPlaceholder}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      <div aria-label={copy.optionsLabel} className={styles.options} id={groupId} role="group">
        {visible.length === 0 ? <p className={styles.note}>{copy.noResults}</p> : null}
        {visible.map((option) => {
          const isChosen = chosen.has(option.value);

          return (
            <label key={option.value} className={styles.option}>
              <input
                checked={isChosen}
                disabled={isDisabled || (isFull && !isChosen)}
                type="checkbox"
                onChange={() => toggle(option.value)}
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
