import messages from '@/i18n/messages/ar.json';
import { routes } from '@/shared/config/routes';
import { ButtonLink } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';

import styles from './status-pages.module.css';

// The 404 content only: the caller provides the shell (header, <main>, footer), so a 404 raised inside the site layout
// is never wrapped in a second one.
export function NotFoundContent() {
  const text = messages.site.footer;
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <EmptyState
          action={
            <div className={styles.buttons}>
              <ButtonLink href={routes.home} variant="outline">
                {messages.site.header.home}
              </ButtonLink>
              <ButtonLink href={routes.books} variant="outline">
                {messages.site.header.store}
              </ButtonLink>
            </div>
          }
          description={text.notFoundDescription}
          headingLevel={1}
          icon="help"
          title={text.notFoundTitle}
          variant="search"
        />
      </div>
    </div>
  );
}
