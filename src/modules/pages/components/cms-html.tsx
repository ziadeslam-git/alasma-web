import messages from '@/i18n/messages/ar.json';
import { EmptyState } from '@/shared/ui/empty-state';

import { sanitizeCmsHtml } from '../sanitize-cms-html';
import styles from './cms-html.module.css';

// The ONLY file in the repo allowed to use dangerouslySetInnerHTML (eslint.config.mjs bans it everywhere else).
// Reason: the body of a static page is admin-written HTML. It is sanitized by the backend at save time and
// sanitized again here with an allowlist, so what reaches the DOM is a string this module produced.
export function CmsHtml({ body }: { body: string }) {
  const html = sanitizeCmsHtml(body);

  if (!html) {
    return (
      <EmptyState
        headingLevel={2}
        icon="book"
        title={messages.pages.emptyTitle}
        description={messages.pages.emptyDescription}
      />
    );
  }

  // The sanitizer output is well-formed, so wrapping each table in a scroll box (a class from our own CSS module,
  // not from the body) is a safe string step; it keeps a wide table from widening the page.
  const wrapped = html
    .replaceAll('<table', `<div class="${styles.scroll}"><table`)
    .replaceAll('</table>', '</table></div>');

  return <div className={styles.content} dangerouslySetInnerHTML={{ __html: wrapped }} />;
}
