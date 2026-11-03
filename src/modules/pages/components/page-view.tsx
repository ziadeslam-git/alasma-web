import messages from '@/i18n/messages/ar.json';
import { routes } from '@/shared/config/routes';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { EmptyState } from '@/shared/ui/empty-state';

import type { StaticPage } from '../api/get-page';
import { getPlainBodyParagraphs } from '../plain-body';
import { CmsHtml } from './cms-html';
import styles from './page-view.module.css';

export function PageView({ page }: { page: StaticPage }) {
  // A body with no "<" at all (the seed pages) stays on the React text path, which is safe by itself. Any body
  // that contains a "<" goes through the sanitizer, so safety never depends on the absence of markup.
  const isMarkup = page.body.includes('<');
  const paragraphs = isMarkup ? [] : getPlainBodyParagraphs(page.body);
  return (
    <article className={styles.page}>
      <Breadcrumbs
        label={messages.pages.breadcrumbLabel}
        items={[{ href: routes.home, label: messages.site.header.home }, { label: page.title }]}
      />
      <h1 className={styles.title}>{page.title}</h1>
      {isMarkup ? (
        <CmsHtml body={page.body} />
      ) : paragraphs.length > 0 ? (
        paragraphs.map((paragraph, index) => (
          <p className={styles.paragraph} key={index}>
            {paragraph}
          </p>
        ))
      ) : (
        <EmptyState
          headingLevel={2}
          icon="book"
          title={messages.pages.emptyTitle}
          description={messages.pages.emptyDescription}
        />
      )}
    </article>
  );
}
