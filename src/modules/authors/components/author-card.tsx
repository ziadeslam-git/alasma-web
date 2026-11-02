import Link from 'next/link';
import type { components } from '@/shared/lib/api';
import { authorRoute } from '@/shared/config/routes';
import { SafeImage } from '@/shared/ui/safe-image';
import styles from './authors.module.css';
export function AuthorCard({ author }: { author: components['schemas']['AuthorListItemDto'] }) {
  return (
    <article className={styles.card}>
      <Link href={authorRoute(author.slug)}>
        <SafeImage alt={author.name} height={180} width={180} src={author.photoUrl} />
        <h2>{author.name}</h2>
      </Link>
      {author.shortBio ? <p>{author.shortBio}</p> : null}
    </article>
  );
}
