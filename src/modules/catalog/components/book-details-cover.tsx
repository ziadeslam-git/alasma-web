'use client';

import { useState } from 'react';

import { BookCover } from '@/shared/ui/book-cover';
import { SafeImage } from '@/shared/ui/safe-image';

import styles from './book-details-cover.module.css';

export type BookDetailsCoverProps = {
  author?: string | undefined;
  className?: string | undefined;
  imageUrl?: string | null | undefined;
  title: string;
  variantKey: string;
};

// The real cover when the API gives one and it loads; otherwise the designed branded cover (title and author on a
// tile), never a blank rectangle. A host that next/image does not allow also ends up on the fallback.
export function BookDetailsCover({
  author,
  className,
  imageUrl,
  title,
  variantKey,
}: BookDetailsCoverProps) {
  const [hasImageFailed, setHasImageFailed] = useState(false);

  if (imageUrl && !hasImageFailed) {
    return (
      <SafeImage
        alt={title}
        aspectRatio="2 / 3"
        className={[styles.image, className].filter(Boolean).join(' ')}
        height={600}
        onError={() => setHasImageFailed(true)}
        priority
        sizes="(max-width: 1000px) 90vw, 520px"
        src={imageUrl}
        width={400}
      />
    );
  }

  return (
    <BookCover
      as="div"
      author={author}
      className={className}
      title={title}
      variantKey={variantKey}
    />
  );
}
