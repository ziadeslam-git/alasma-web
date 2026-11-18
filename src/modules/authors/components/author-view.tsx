import type { ReactNode } from 'react';
import messages from '@/i18n/messages/ar.json';
import { routes } from '@/shared/config/routes';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { ButtonLink } from '@/shared/ui/button';
import type { Author } from '../api/authors';
import { AuthorAvatar } from './author-avatar';
import styles from './authors.module.css';
export function AuthorView({ author, children }: { author: Author; children: ReactNode }) {
  return (
    <div className={styles.container}>
      <Breadcrumbs
        label={messages.catalog.detail.breadcrumbsLabel}
        items={[
          { label: messages.site.header.home, href: routes.home },
          { label: messages.site.header.authors, href: routes.authors },
          { label: author.name },
        ]}
      />
      <div className={styles.profile}>
        <AuthorAvatar name={author.name} photoUrl={author.photoUrl} priority size={240} />
        <div>
          <h1>{author.name}</h1>
          {author.fullBio || author.shortBio ? (
            <p className={styles.bio}>{author.fullBio || author.shortBio}</p>
          ) : null}
        </div>
      </div>
      <section className={styles.booksSection}>
        <h2>{messages.authors.booksHeading}</h2>
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
