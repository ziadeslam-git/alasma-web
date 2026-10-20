import messages from '@/i18n/messages/ar.json';
import { BookCover } from '@/shared/ui/book-cover';

import styles from '../components.module.css';

export function BookCoverSection() {
  const text = messages.devComponents.bookCover;

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>{text.heading}</h2>
      <div className={styles.grid}>
        <div className={styles.card}>
          <h3 className={styles.subheading}>{text.drawn}</h3>
          <BookCover title={text.title} variantKey="dev-drawn-cover" />
        </div>
        <div className={styles.card}>
          <h3 className={styles.subheading}>{text.image}</h3>
          <BookCover imageUrl="/book-cover.jpg" title={text.title} variantKey="dev-image-cover" />
        </div>
      </div>
    </section>
  );
}
