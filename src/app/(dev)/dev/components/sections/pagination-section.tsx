import messages from '@/i18n/messages/ar.json';
import { Pagination } from '@/shared/ui/pagination';

import styles from '../components.module.css';

export function PaginationSection() {
  const text = messages.devComponents.pagination;

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>{text.heading}</h2>
      <div className={styles.card}>
        <Pagination
          buildHref={(page) => `/dev/components?page=${page}`}
          label={text.label}
          nextLabel={text.next}
          page={6}
          previousLabel={text.previous}
          totalPages={12}
        />
      </div>
    </section>
  );
}
