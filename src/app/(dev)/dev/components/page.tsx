import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ButtonSection } from './sections/button-section';
import { FieldInputSection } from './sections/field-input-section';
import styles from './components.module.css';

export const metadata: Metadata = {
  title: 'Components (dev)',
  robots: { index: false, follow: false },
};

// Development reference page: component sections stay isolated so future primitives avoid editing this page.
export default function ComponentsPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return (
    <main className={styles.page}>
      <ButtonSection />
      <FieldInputSection />
    </main>
  );
}
