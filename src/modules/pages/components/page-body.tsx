import messages from '@/i18n/messages/ar.json';
import { EmptyState } from '@/shared/ui/empty-state';

import type { StaticPage } from '../api/get-page';
import { getPlainBodyParagraphs } from '../plain-body';
import { CmsHtml } from './cms-html';
import styles from './page-view.module.css';

export function PageBody({ page }: { page: StaticPage }) {
  // A body with no "<" at all (the seed pages) stays on the React text path, which is safe by itself. Any body
  // that contains a "<" goes through the sanitizer, so safety never depends on the absence of markup.
  const isMarkup = page.body.includes('<');
  if (isMarkup) return <CmsHtml body={page.body} />;
  const paragraphs = getPlainBodyParagraphs(page.body);
  if (paragraphs.length === 0) {
    return (
      <EmptyState
        headingLevel={2}
        icon="book"
        title={messages.pages.emptyTitle}
        description={messages.pages.emptyDescription}
      />
    );
  }
  return (
    <>
      {paragraphs.map((paragraph, index) => (
        <p className={styles.paragraph} key={index}>
          {paragraph}
        </p>
      ))}
    </>
  );
}
