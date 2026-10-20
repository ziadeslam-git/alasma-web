import { createElement, type ReactNode } from 'react';

import { Icon, type IconName } from '@/shared/ui/icon';

import styles from './empty-state.module.css';

export type EmptyStateVariant = 'empty' | 'search' | 'error';
export type EmptyStateHeadingLevel = 2 | 3 | 4 | 5 | 6;

export type EmptyStateProps = {
  action?: ReactNode;
  description: string;
  headingLevel?: EmptyStateHeadingLevel;
  icon: IconName;
  title: string;
  variant?: EmptyStateVariant;
};

export function EmptyState({
  action,
  description,
  headingLevel = 2,
  icon,
  title,
  variant = 'empty',
}: EmptyStateProps) {
  const heading = createElement(`h${headingLevel}`, { className: styles.title }, title);

  return (
    <section className={`${styles.emptyState} ${styles[variant] ?? ''}`}>
      <span aria-hidden="true" className={styles.iconWrap}>
        <Icon name={icon} size="lg" />
      </span>
      {heading}
      <p className={styles.description}>{description}</p>
      {action ? <div className={styles.action}>{action}</div> : null}
    </section>
  );
}
