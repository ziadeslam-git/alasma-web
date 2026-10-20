import messages from '@/i18n/messages/ar.json';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs';

import styles from '../components.module.css';

export function BreadcrumbsSection() {
  const text = messages.devComponents.breadcrumbs;

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>{text.heading}</h2>
      <div className={styles.card}>
        <Breadcrumbs
          items={[
            { href: '/', label: text.home },
            { href: '/catalog', label: text.catalog },
            { label: text.current },
          ]}
          label={text.label}
        />
      </div>
    </section>
  );
}
