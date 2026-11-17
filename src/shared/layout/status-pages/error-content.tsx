'use client';

import messages from '@/i18n/messages/ar.json';
import { routes } from '@/shared/config/routes';
import { Button, ButtonLink } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';

import styles from './status-pages.module.css';

export type ErrorContentProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

// The error content only: the caller provides the shell or at least a <main>, so this page always has one <h1>.
export function ErrorContent({ error, reset }: ErrorContentProps) {
  const text = messages.site.footer;
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <EmptyState
          action={
            <div className={styles.actions}>
              <div className={styles.buttons}>
                <Button onClick={reset}>{text.retry}</Button>
                <ButtonLink href={routes.home} variant="outline">
                  {messages.site.header.home}
                </ButtonLink>
              </div>
              {error.digest ? (
                <p className={styles.reference} data-error-reference>
                  {text.reference}: <bdi dir="ltr">{error.digest}</bdi>
                </p>
              ) : null}
            </div>
          }
          description={text.errorDescription}
          headingLevel={1}
          icon="help"
          title={text.errorTitle}
          variant="error"
        />
      </div>
    </div>
  );
}
