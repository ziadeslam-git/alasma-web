'use client';

import styles from './filter-option.module.css';

const depthClasses = [styles.depth0 ?? '', styles.depth1 ?? '', styles.depth2 ?? ''];

export type FilterOptionProps = {
  checked: boolean;
  depth?: number;
  kind: 'radio' | 'checkbox';
  label: string;
  name?: string;
  onChange: () => void;
  value?: string;
};

// One radio or checkbox with its label. Checked state always comes from the props (the URL).
export function FilterOption({
  checked,
  depth = 0,
  kind,
  label,
  name,
  onChange,
  value,
}: FilterOptionProps) {
  const depthClass = depthClasses[Math.min(depth, depthClasses.length - 1)] ?? '';

  return (
    <label className={`${styles.option} ${depthClass}`}>
      <input
        checked={checked}
        className={`${styles.control} ${kind === 'radio' ? styles.radio : styles.checkbox}`}
        name={name}
        onChange={onChange}
        type={kind}
        value={value}
      />
      <span className={styles.label}>{label}</span>
    </label>
  );
}
