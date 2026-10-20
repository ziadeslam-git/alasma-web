import Link from 'next/link';
import type { AnchorHTMLAttributes } from 'react';

import { Icon, type IconName } from '@/shared/ui/icon';

import styles from './button.module.css';
import type { ButtonSize, ButtonVariant } from './button';

type ButtonLinkTextContent = {
  children: string;
  label?: string;
  'aria-label'?: string;
};

type IconOnlyButtonLinkContent = {
  children?: never;
  label: string;
  'aria-label'?: string;
};

type ButtonLinkBaseProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  'aria-label' | 'children' | 'className' | 'href'
> & {
  className?: string;
  fullWidth?: boolean;
  href: string;
  leadingIcon?: IconName;
  size?: ButtonSize;
  trailingIcon?: IconName;
  variant?: ButtonVariant;
};

export type ButtonLinkProps = ButtonLinkBaseProps &
  (ButtonLinkTextContent | IconOnlyButtonLinkContent);

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

function isExternalHref(href: string) {
  return /^(https?:)?\/\//.test(href);
}

export function ButtonLink({
  'aria-label': ariaLabel,
  children,
  className,
  fullWidth = false,
  href,
  label,
  leadingIcon,
  size = 'md',
  trailingIcon,
  variant = 'primary',
  ...props
}: ButtonLinkProps) {
  const linkClassName = [
    styles.button,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? styles.fullWidth : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  const content = (
    <>
      {leadingIcon ? <Icon name={leadingIcon} size="sm" /> : null}
      {children}
      {trailingIcon ? <Icon name={trailingIcon} size="sm" /> : null}
    </>
  );
  const accessibleLabel = ariaLabel ?? label;

  if (isExternalHref(href)) {
    return (
      <a
        {...props}
        aria-label={accessibleLabel}
        className={linkClassName}
        href={href}
        rel="noopener noreferrer"
      >
        {content}
      </a>
    );
  }

  return (
    <Link {...props} aria-label={accessibleLabel} className={linkClassName} href={href}>
      {content}
    </Link>
  );
}
