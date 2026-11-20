import messages from '@/i18n/messages/ar.json';

import type { BookCardItem } from '../types';
import { BookGrid } from './book-grid';
import styles from './book-details-view.module.css';

export type RelatedBooksSectionProps = { books: readonly BookCardItem[] };

// The "related books" block of the book page, shared with BookDetailsView so the page's styles stay inside the module.
export function RelatedBooksSection({ books }: RelatedBooksSectionProps) {
  return (
    <section aria-labelledby="related-heading" className={styles.relatedSection}>
      <h2 className={styles.sectionHeading} id="related-heading">
        {messages.catalog.detail.related.heading}
      </h2>
      <BookGrid items={books} />
    </section>
  );
}
