'use client';

import { useState } from 'react';

import { SafeImage } from '@/shared/ui/safe-image';

import styles from './book-cover.module.css';

export type BookCoverProps = {
  as?: 'article' | 'div';
  // Shown under the title on the designed (no image) cover. Cards do not pass it and keep the decorative line.
  author?: string;
  className?: string;
  imageUrl?: string | null;
  priority?: boolean;
  title: string;
  variantKey: string;
};

const coverVariants = [
  styles.variantOne ?? '',
  styles.variantTwo ?? '',
  styles.variantThree ?? '',
  styles.variantFour ?? '',
];

export function getBookCoverVariant(variantKey: string) {
  let hash = 0;
  for (const character of variantKey) {
    hash = (hash * 31 + character.charCodeAt(0)) | 0;
  }

  return Math.abs(hash) % coverVariants.length;
}

export function BookCover({
  as: Root = 'article',
  author,
  className,
  imageUrl,
  priority = false,
  title,
  variantKey,
}: BookCoverProps) {
  // An image that fails to load (or a host next/image refuses) falls back to the designed cover, never a blank tile.
  const [hasImageFailed, setHasImageFailed] = useState(false);
  const coverClassName = [styles.cover, className].filter(Boolean).join(' ');

  if (imageUrl && !hasImageFailed) {
    // A real cover image is the whole cover: it takes the book's radius and shadow but not the designed cover's
    // padding, frame or background.
    return (
      <SafeImage
        alt={title}
        aspectRatio="2 / 3"
        className={[styles.image, className].filter(Boolean).join(' ')}
        onError={() => setHasImageFailed(true)}
        priority={priority}
        src={imageUrl}
        width={400}
        height={600}
      />
    );
  }

  const variantClass = coverVariants[getBookCoverVariant(variantKey)] ?? '';
  return (
    <Root
      aria-label={Root === 'article' ? title : undefined}
      className={`${coverClassName} ${variantClass}`}
    >
      <span aria-hidden="true" className={styles.line} />
      <b className={styles.title}>{title}</b>
      {author ? (
        <span className={styles.authorName}>{author}</span>
      ) : (
        <span aria-hidden="true" className={styles.authorLine} />
      )}
    </Root>
  );
}
