import messages from '@/i18n/messages/ar.json';
import { Button } from '@/shared/ui/button';
import { EmptyState, type EmptyStateVariant } from '@/shared/ui/empty-state';

import styles from '../components.module.css';

const variants: EmptyStateVariant[] = ['empty', 'search', 'error'];

export function EmptyStateSection() {
  const text = messages.devComponents.emptyState;

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>{text.heading}</h2>
      <div className={styles.grid}>
        {variants.map((variant) => (
          <EmptyState
            key={variant}
            action={variant === 'error' ? <Button>{text.retry}</Button> : undefined}
            description={text.variants[variant].description}
            icon={variant === 'error' ? 'help' : variant === 'search' ? 'search' : 'package'}
            title={text.variants[variant].title}
            variant={variant}
          />
        ))}
      </div>
    </section>
  );
}
