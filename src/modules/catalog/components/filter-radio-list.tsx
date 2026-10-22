'use client';

import { useId, useState } from 'react';

import { Input } from '@/shared/ui/input';

import { matchesOption, type SelectOption } from '../url/select-options';
import { FilterOption } from './filter-option';
import styles from './filter-radio-list.module.css';

export type FilterRadioListProps = {
  allLabel: string;
  // Shows a text filter above the list (the design has one for authors). The text is the only local state.
  search?: { label: string; noMatchLabel: string };
  onChange: (value: string | undefined) => void;
  options: readonly SelectOption[];
  value: string | undefined;
};

// One choice among many, plus "all". The API takes a single value for category, author and publisher, so these are
// radios (the design's author checkboxes would promise a multi-select the backend does not have).
export function FilterRadioList({
  allLabel,
  onChange,
  options,
  search,
  value,
}: FilterRadioListProps) {
  const name = useId();
  const [searchText, setSearchText] = useState('');
  const needle = searchText.trim().toLowerCase();

  const selected = options.find((option) => matchesOption(option, value));
  // A value in the URL that is not in the list (for example an author beyond the first page) is still shown, checked.
  const unknownValue = value !== undefined && !selected ? value : undefined;
  const visible = needle
    ? options.filter((option) => option === selected || option.label.toLowerCase().includes(needle))
    : options;

  return (
    <div className={styles.wrapper}>
      {search ? (
        <Input
          aria-label={search.label}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder={search.label}
          type="search"
          value={searchText}
        />
      ) : null}
      <div className={styles.list}>
        <FilterOption
          checked={value === undefined}
          kind="radio"
          label={allLabel}
          name={name}
          onChange={() => onChange(undefined)}
        />
        {unknownValue ? (
          <FilterOption
            checked
            kind="radio"
            label={unknownValue}
            name={name}
            onChange={() => undefined}
          />
        ) : null}
        {visible.map((option) => (
          <FilterOption
            checked={option === selected}
            depth={option.depth ?? 0}
            key={`${option.value}-${option.label}`}
            kind="radio"
            label={option.label}
            name={name}
            onChange={() => onChange(option.value)}
            value={option.value}
          />
        ))}
        {search && needle && visible.every((option) => option === selected) ? (
          <p className={styles.none}>{search.noMatchLabel}</p>
        ) : null}
      </div>
    </div>
  );
}
