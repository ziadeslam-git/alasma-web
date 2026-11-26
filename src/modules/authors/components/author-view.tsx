import type { ReactNode } from 'react';

import messages from '@/i18n/messages/ar.json';
import { routes } from '@/shared/config/routes';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { ButtonLink } from '@/shared/ui/button';
import { FeatureGate } from '@/shared/ui/soon';

import type { Author } from '../api/authors';
import { AuthorAvatar } from './author-avatar';
import styles from './authors.module.css';

// design/Author.dc.html: the breadcrumb (authors > name), the author's card (.ph2: avatar, name, bio, stat) and the
// books heading with the grid. The books total is not in the author API, so the stat is shown dimmed (soon).
export function AuthorView({ author, children }: { author: Author; children: ReactNode }) {
  return (
    <div className={styles.container}>
      <Breadcrumbs
        label={messages.catalog.detail.breadcrumbsLabel}
        items={[
          { label: messages.site.header.authors, href: routes.authors },
          { label: author.name },
        ]}
      />
      <div className={styles.profile}>
        <AuthorAvatar
          name={author.name}
          photoUrl={author.photoUrl}
          priority
          size={160}
          variant="hero"
        />
        <div>
          <h1>{author.name}</h1>
          {author.fullBio || author.shortBio ? (
            <p className={styles.bio}>{author.fullBio || author.shortBio}</p>
          ) : null}
        </div>
        <FeatureGate feature="author-books-count" label={messages.site.soon}>
          <div className={styles.stat}>
            <b>—</b>
            <span>{messages.authors.booksInStore}</span>
          </div>
        </FeatureGate>
      </div>
      <section className={styles.booksSection}>
        <h2>{messages.authors.booksHeadingNamed.replace('{name}', author.name)}</h2>
        {children}
        <ButtonLink
          className={styles.viewAll}
          href={`${routes.books}?author=${encodeURIComponent(author.slug)}`}
          size="sm"
          variant="outline"
        >
          {messages.authors.viewAll}
        </ButtonLink>
      </section>
    </div>
  );
}
