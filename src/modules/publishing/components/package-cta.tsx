'use client';

import { selectPackage } from '../state/package-selection';
import styles from './publishing.module.css';

// "اطلب هذه الباقة": remembers the package for the request form and jumps to it (plain anchor, so it works without JS).
export function PackageCta({
  id,
  isPrimary,
  label,
}: {
  id: number;
  isPrimary: boolean;
  label: string;
}) {
  return (
    <a
      className={isPrimary ? `${styles.cta} ${styles.ctaPrimary}` : styles.cta}
      href="#req"
      onClick={() => selectPackage(id)}
    >
      {label}
    </a>
  );
}
