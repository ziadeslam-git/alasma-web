import type { ReactNode } from 'react';

import styles from './form.module.css';

// A page-level message (success, invalid link, loading) with the one <h1> of the page.
export function AuthMessage({
  busy,
  children,
  description,
  title,
}: {
  busy?: boolean;
  children?: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div aria-busy={busy || undefined} className={styles.form}>
      <h1>{title}</h1>
      <p>{description}</p>
      {children}
    </div>
  );
}
