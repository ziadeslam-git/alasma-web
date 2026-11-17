import type { ReactNode } from 'react';

import styles from './page-frame.module.css';

// Wraps header, content and footer. A direct `<main>` child takes the spare height; a layout whose content is not a
// direct `<main>` child (the account area) wraps it in <PageFrameGrow> instead.
export function PageFrame({ children }: { children: ReactNode }) {
  return <div className={styles.frame}>{children}</div>;
}

export function PageFrameGrow({ children }: { children: ReactNode }) {
  return <div className={styles.grow}>{children}</div>;
}
