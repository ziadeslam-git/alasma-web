import Link from 'next/link';
import type { ReactNode } from 'react';
import messages from '@/i18n/messages/ar.json';
import { routes } from '@/shared/config/routes';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { SafeImage } from '@/shared/ui/safe-image';
import type { Author } from '../api/authors';
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
        <SafeImage alt={author.name} priority width={240} height={240} src={author.photoUrl} />
        <div>
          <h1>{author.name}</h1>
          {author.fullBio || author.shortBio ? (
            <p className={styles.bio}>{author.fullBio || author.shortBio}</p>
          ) : null}
        </div>
      </div>
      <section>
        <h2>{messages.authors.booksHeading}</h2>
        {children}
        <Link href={`${routes.books}?author=${encodeURIComponent(author.slug)}`}>
          {messages.authors.viewAll}
        </Link>
      </section>
    </div>
  );
}
