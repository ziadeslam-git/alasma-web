import type { ReactNode } from 'react';

import styles from './catalog-intro.module.css';

// What a catalog page shows above CatalogView (the category breadcrumb and its sub-category chips), in the page gutter.
export function CatalogIntro({ children }: { children: ReactNode }) {
  return <div className={styles.intro}>{children}</div>;
}
