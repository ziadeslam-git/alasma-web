'use client';

import { useState } from 'react';

import { BookCover } from '@/shared/ui/book-cover';
import { SafeImage } from '@/shared/ui/safe-image';

import styles from './book-details-cover.module.css';

export type BookDetailsCoverProps = {
  author?: string | undefined;
  imageUrl?: string | null | undefined;
  title: string;
  variantKey: string;
};

// The real cover when the API gives one and it loads; otherwise the designed branded cover (title and author on a
// tile), never a blank rectangle. A host that next/image does not allow also ends up on the fallback.
export function BookDetailsCover({ author, imageUrl, title, variantKey }: BookDetailsCoverProps) {
  const [hasImageFailed, setHasImageFailed] = useState(false);

  if (imageUrl && !hasImageFailed) {
    return (
      <SafeImage
        alt={title}
        aspectRatio="2 / 3"
        className={styles.image}
        height={600}
        onError={() => setHasImageFailed(true)}
        priority
        src={imageUrl}
        width={400}
      />
    );
  }

  return <BookCover as="div" author={author} title={title} variantKey={variantKey} />;
}
