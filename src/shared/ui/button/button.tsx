'use client';

import type { ButtonHTMLAttributes } from 'react';

import { Icon, type IconName } from '@/shared/ui/icon';

import styles from './button.module.css';

export type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'soft';
export type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonTextContent = {
  children: string;
  label?: string;
  'aria-label'?: string;
};

type IconOnlyButtonContent = {
  children?: never;
  label: string;
  'aria-label'?: string;
};

type ButtonBaseProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'aria-label' | 'children' | 'className' | 'type'
> & {
  className?: string;
  fullWidth?: boolean;
  leadingIcon?: IconName;
  loading?: boolean;
  size?: ButtonSize;
  trailingIcon?: IconName;
  variant?: ButtonVariant;
};

export type ButtonProps = ButtonBaseProps & (ButtonTextContent | IconOnlyButtonContent);

const variantClasses: Record<ButtonVariant, string> = {
  primary: styles.primary ?? '',
  outline: styles.outline ?? '',
  ghost: styles.ghost ?? '',
  soft: styles.soft ?? '',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: styles.sizeSmall ?? '',
  md: styles.sizeMedium ?? '',
  lg: styles.sizeLarge ?? '',
};

export function Button({
  'aria-label': ariaLabel,
  children,
  className,
  disabled,
  fullWidth = false,
  label,
  leadingIcon,
  loading = false,
  onClick,
  size = 'md',
  trailingIcon,
  variant = 'primary',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const buttonClassName = [
    styles.button,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? styles.fullWidth : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      {...props}
      aria-busy={loading || undefined}
      aria-label={ariaLabel ?? label ?? (loading ? children : undefined)}
      className={buttonClassName}
      disabled={isDisabled}
      onClick={(event) => {
        if (!loading) {
          onClick?.(event);
        }
      }}
      type="button"
    >
      <span aria-hidden={loading} className={styles.content}>
        {leadingIcon ? <Icon name={leadingIcon} size="sm" /> : null}
        {children}
        {trailingIcon ? <Icon name={trailingIcon} size="sm" /> : null}
      </span>
      {loading ? <span aria-hidden="true" className={styles.spinner} /> : null}
    </button>
  );
}
