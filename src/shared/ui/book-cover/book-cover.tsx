import { SafeImage } from '@/shared/ui/safe-image';

import styles from './book-cover.module.css';

export type BookCoverProps = {
  as?: 'article' | 'div';
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
  className,
  imageUrl,
  priority = false,
  title,
  variantKey,
}: BookCoverProps) {
  const coverClassName = [styles.cover, className].filter(Boolean).join(' ');

  if (imageUrl) {
    return (
      <SafeImage
        alt={title}
        aspectRatio="2 / 3"
        className={coverClassName}
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
      <span aria-hidden="true" className={styles.authorLine} />
    </Root>
  );
}
