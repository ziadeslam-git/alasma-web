import messages from '@/i18n/messages/ar.json';
import { routes } from '@/shared/config/routes';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs';

import type { StaticPage } from '../api/get-page';
import { PageBody } from './page-body';
import styles from './policy-page.module.css';
import { PolicyNav } from './policy-nav';

// design/Policies.dc.html: title on top, side navigation of the four policy pages, the CMS body in a card.
export function PolicyPage({ page }: { page: StaticPage }) {
  return (
    <div className={styles.page}>
      <Breadcrumbs
        label={messages.pages.breadcrumbLabel}
        items={[{ href: routes.home, label: messages.site.header.home }, { label: page.title }]}
      />
      <h1 className={styles.title}>{page.title}</h1>
      <div className={styles.layout}>
        <PolicyNav activeKey={page.key} />
        <article className={styles.article}>
          <PageBody page={page} />
        </article>
      </div>
    </div>
  );
}
