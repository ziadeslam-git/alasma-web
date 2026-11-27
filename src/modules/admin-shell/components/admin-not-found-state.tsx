import messages from '@/i18n/messages/ar.json';
import { routes } from '@/shared/config/routes';
import { ButtonLink } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';

import styles from './admin-shell.module.css';

// 404 inside the admin area (the frame stays around it).
export function AdminNotFoundState() {
  const text = messages.admin.notFound;

  return (
    <div className={styles.state} data-admin-state="not-found">
      <EmptyState
        action={<ButtonLink href={routes.admin}>{text.back}</ButtonLink>}
        description={text.description}
        headingLevel={1}
        icon="search"
        title={text.title}
      />
    </div>
  );
}
