import type { Metadata } from 'next';

import messages from '@/i18n/messages/ar.json';
import { routes } from '@/shared/config/routes';
import { SiteShell } from '@/shared/layout/site-shell';
import { ButtonLink } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function NotFound() {
  const text = messages.site.footer;
  return (
    <SiteShell>
      <EmptyState
        action={
          <>
            <ButtonLink href={routes.home} variant="outline">
              {messages.site.header.home}
            </ButtonLink>
            <ButtonLink href={routes.books} variant="outline">
              {messages.site.header.store}
            </ButtonLink>
          </>
        }
        description={text.notFoundDescription}
        icon="help"
        title={text.notFoundTitle}
        variant="search"
      />
    </SiteShell>
  );
}
