import type { ReactNode } from 'react';

import styles from './auth-card.module.css';

export function AuthCard({ children }: { children: ReactNode }) {
  return <section className={styles.card}>{children}</section>;
}
