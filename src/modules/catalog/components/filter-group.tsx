import type { ReactNode } from 'react';

import { Icon } from '@/shared/ui/icon';

import styles from './filter-group.module.css';

export type FilterGroupProps = {
  children: ReactNode;
  defaultOpen?: boolean;
  title: string;
};

// A collapsible group like the design's details/summary. The heading is a real h3, the options sit in a fieldset
// with a legend (visually hidden: the heading already shows the same text).
export function FilterGroup({ children, defaultOpen = true, title }: FilterGroupProps) {
  return (
    <details className={styles.group} open={defaultOpen}>
      <summary className={styles.summary}>
        <h3 className={styles.title}>{title}</h3>
        <span aria-hidden="true" className={styles.chevron}>
          <Icon name="chev-d" size="sm" />
        </span>
      </summary>
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>{title}</legend>
        {children}
      </fieldset>
    </details>
  );
}
