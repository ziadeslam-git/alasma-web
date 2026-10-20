'use client';

import messages from '@/i18n/messages/ar.json';
import { routes } from '@/shared/config/routes';
import { Button, ButtonLink } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';

export default function ErrorPage({
  error,
  reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  const text = messages.site.footer;
  const reference = error.digest ? `${text.reference}: ${error.digest}` : '';
  return (
    <EmptyState
      action={
        <>
          <Button onClick={reset}>{text.retry}</Button>
          <ButtonLink href={routes.home} variant="outline">
            {messages.site.header.home}
          </ButtonLink>
          {reference ? <small>{reference}</small> : null}
        </>
      }
      description={text.errorDescription}
      icon="help"
      title={text.errorTitle}
      variant="error"
    />
  );
}
