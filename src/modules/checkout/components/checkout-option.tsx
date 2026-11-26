'use client';

import { useId, type ChangeEvent, type ReactNode } from 'react';
import { Icon, type IconName } from '@/shared/ui/icon';
import styles from './checkout-option.module.css';

type CheckoutOptionProps = {
  badge?: ReactNode;
  checked: boolean;
  description?: string;
  disabled?: boolean;
  icon?: IconName;
  name: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  title: string;
  value?: string;
};

// A radio card: the radio is named by the title only, the description is read as its description.
export function CheckoutOption({
  badge,
  checked,
  description,
  disabled,
  icon,
  name,
  onChange,
  title,
  value,
}: CheckoutOptionProps) {
  const id = useId();
  return (
    <label className={styles.option}>
      <input
        aria-describedby={description ? `${id}-description` : undefined}
        aria-labelledby={`${id}-title`}
        checked={checked}
        className={styles.radio}
        disabled={disabled}
        name={name}
        onChange={onChange}
        type="radio"
        value={value}
      />
      {icon ? (
        <span aria-hidden="true" className={styles.icon}>
          <Icon name={icon} />
        </span>
      ) : null}
      <span className={styles.text}>
        <b id={`${id}-title`}>{title}</b>
        {description ? <span id={`${id}-description`}>{description}</span> : null}
      </span>
      {badge}
    </label>
  );
}
