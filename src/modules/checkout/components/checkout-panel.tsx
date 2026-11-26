import type { ReactNode } from 'react';
import styles from './checkout-panel.module.css';

type CheckoutPanelProps = {
  children: ReactNode;
  step: number;
  title: string;
  titleId: string;
};

// A numbered white card for one checkout step (address, payment, notes).
export function CheckoutPanel({ children, step, title, titleId }: CheckoutPanelProps) {
  return (
    <section aria-labelledby={titleId} className={styles.panel}>
      <h2 className={styles.title} id={titleId}>
        <em aria-hidden="true" className={styles.number}>
          {step}
        </em>
        {title}
      </h2>
      {children}
    </section>
  );
}
