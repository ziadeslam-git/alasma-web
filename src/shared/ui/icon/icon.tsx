import type { IconName } from '@/shared/icons/icon-registry';
import { iconRegistry } from '@/shared/icons/icon-registry';

import styles from './icon.module.css';

export type IconSize = 'sm' | 'md' | 'lg';

export type IconProps = {
  name: IconName;
  size?: IconSize;
  label?: string;
  className?: string;
};

const sizeClasses: Record<IconSize, string> = {
  sm: styles.sizeSmall ?? '',
  md: styles.sizeMedium ?? '',
  lg: styles.sizeLarge ?? '',
};

export function Icon({ name, size = 'md', label, className }: IconProps) {
  const icon = iconRegistry[name];
  const svgClassName = className
    ? `${styles.icon} ${sizeClasses[size]} ${className}`
    : `${styles.icon} ${sizeClasses[size]}`;

  return (
    <svg
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className={svgClassName}
      fill="currentColor"
      focusable={label ? undefined : false}
      role={label ? 'img' : undefined}
      stroke="currentColor"
      viewBox={icon.viewBox}
      xmlns="http://www.w3.org/2000/svg"
    >
      {icon.body.split(/(?=<)/).map((shape, index) => (
        <IconShape key={`${name}-${index}`} markup={shape} />
      ))}
    </svg>
  );
}

function IconShape({ markup }: { markup: string }) {
  const shape = markup.match(/^<(path|circle|rect|line|polyline|polygon|ellipse|g)(.*)\/>$/);
  if (!shape) {
    return null;
  }

  const [, tag, attributes] = shape;
  if (!tag) {
    return null;
  }

  const props = Object.fromEntries(
    [...(attributes ?? '').matchAll(/([\w-]+)="([^"]*)"/g)].map(([, name, value]) => [
      name === 'stroke-width'
        ? 'strokeWidth'
        : name === 'stroke-linecap'
          ? 'strokeLinecap'
          : name === 'stroke-linejoin'
            ? 'strokeLinejoin'
            : name === 'fill-rule'
              ? 'fillRule'
              : name === 'clip-rule'
                ? 'clipRule'
                : name,
      value,
    ]),
  );

  return createElement(tag, props);
}
import { createElement } from 'react';
