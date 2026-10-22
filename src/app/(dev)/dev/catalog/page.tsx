import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import messages from '@/i18n/messages/ar.json';
import { BookGrid } from '@/modules/catalog';

import { catalogFixtures } from './catalog-fixtures';
import styles from './catalog.module.css';

export const metadata: Metadata = {
  title: 'Catalog cards & grid (dev)',
  robots: { index: false, follow: false },
};

// Development reference page for BookCard and BookGrid states. Returns 404 in production.
export default function DevCatalogPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  const text = messages.devCatalog;

  return (
    <main className={styles.page} id="main-content">
      <header className={styles.header}>
        <h1 className={styles.title}>{text.title}</h1>
        <p className={styles.description}>{text.description}</p>
      </header>

      <section aria-labelledby="states-heading" className={styles.section}>
        <h2 className={styles.heading} id="states-heading">
          {text.statesHeading}
        </h2>
        <BookGrid items={catalogFixtures} />
      </section>

      <section aria-labelledby="loading-heading" className={styles.section}>
        <h2 className={styles.heading} id="loading-heading">
          {text.loadingHeading}
        </h2>
        <BookGrid isLoading items={[]} skeletonCount={4} />
      </section>

      <section aria-labelledby="empty-heading" className={styles.section}>
        <h2 className={styles.heading} id="empty-heading">
          {text.emptyHeading}
        </h2>
        <BookGrid items={[]} />
      </section>
    </main>
  );
}
