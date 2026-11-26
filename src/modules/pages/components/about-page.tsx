import Link from 'next/link';

import messages from '@/i18n/messages/ar.json';
import { routes } from '@/shared/config/routes';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs';

import type { StaticPage } from '../api/get-page';
import styles from './about-page.module.css';
import { PageBody } from './page-body';

// design/About.dc.html: green hero (tag + title), the CMS body in a card, a call to action towards /publish.
export function AboutPage({ page }: { page: StaticPage }) {
  return (
    <div className={styles.page}>
      <Breadcrumbs
        label={messages.pages.breadcrumbLabel}
        items={[{ href: routes.home, label: messages.site.header.home }, { label: page.title }]}
      />
      <header className={styles.hero}>
        <span className={styles.tag}>{messages.pages.about.tag}</span>
        <h1>{page.title}</h1>
      </header>
      <article className={styles.body}>
        <PageBody page={page} />
      </article>
      <section className={styles.cta}>
        <div>
          <p className={styles.ctaTitle}>{messages.pages.about.ctaTitle}</p>
          <p className={styles.ctaText}>{messages.pages.about.ctaText}</p>
        </div>
        <Link className={styles.ctaLink} href={routes.publish}>
          {messages.pages.about.ctaButton}
        </Link>
      </section>
    </div>
  );
}
