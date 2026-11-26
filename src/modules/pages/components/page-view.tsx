import messages from '@/i18n/messages/ar.json';
import { routes } from '@/shared/config/routes';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs';

import type { StaticPage } from '../api/get-page';
import { AboutPage } from './about-page';
import { PageBody } from './page-body';
import styles from './page-view.module.css';
import { PolicyPage } from './policy-page';
import { isPolicyKey } from './policy-nav';

export function PageView({ page }: { page: StaticPage }) {
  if (isPolicyKey(page.key)) return <PolicyPage page={page} />;
  if (page.key === 'about') return <AboutPage page={page} />;
  return (
    <article className={styles.page}>
      <Breadcrumbs
        label={messages.pages.breadcrumbLabel}
        items={[{ href: routes.home, label: messages.site.header.home }, { label: page.title }]}
      />
      <h1 className={styles.title}>{page.title}</h1>
      <PageBody page={page} />
    </article>
  );
}
