import messages from '@/i18n/messages/ar.json';
import { routes } from '@/shared/config/routes';
import { ButtonLink } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';

import styles from './admin-shell.module.css';

// 403: the visitor is signed in but has no permission for this page. Never a blank page and never a silent redirect.
export function ForbiddenState() {
  const text = messages.admin.forbidden;

  return (
    <div className={styles.state} data-admin-state="forbidden">
      <EmptyState
        action={<ButtonLink href={routes.home}>{text.home}</ButtonLink>}
        description={text.description}
        headingLevel={1}
        icon="lock"
        title={text.title}
        variant="error"
      />
    </div>
  );
}
