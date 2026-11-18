import Link from 'next/link';
import type { components } from '@/shared/lib/api';
import { authorRoute } from '@/shared/config/routes';
import { AuthorAvatar } from './author-avatar';
import styles from './authors.module.css';
export function AuthorCard({ author }: { author: components['schemas']['AuthorListItemDto'] }) {
  return (
    <article className={styles.card}>
      <Link href={authorRoute(author.slug)}>
        <AuthorAvatar decorative name={author.name} photoUrl={author.photoUrl} size={180} />
        <h2>{author.name}</h2>
      </Link>
      {author.shortBio ? <p>{author.shortBio}</p> : null}
    </article>
  );
}
