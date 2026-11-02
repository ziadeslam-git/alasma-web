import messages from '@/i18n/messages/ar.json';
import { BookGrid, getRelatedBooks } from '@/modules/catalog';
import styles from '@/modules/catalog/components/book-details-view.module.css';

export async function RelatedBooks({ slug }: { slug: string }) {
  const books = await getRelatedBooks(slug);

  if (books.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="related-heading" className={styles.relatedSection}>
      <h2 className={styles.sectionHeading} id="related-heading">
        {messages.catalog.detail.related.heading}
      </h2>
      <BookGrid items={books} />
    </section>
  );
}
