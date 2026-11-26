import { SafeImage } from '@/shared/ui/safe-image';

import styles from './authors.module.css';

// Arabic diacritics (tashkeel and the dagger alef) come after the letter and must not be what is shown
const DIACRITICS = /[\u064B-\u065F\u0670]/g;
// the definite article (alif, lam), built from code points: Arabic text does not belong in code
const ARTICLE = String.fromCodePoint(0x0627, 0x0644);

function firstLetter(word: string): string {
  // a leading article "ال" tells nothing about the name, so the letter after it is shown
  const base =
    word.startsWith(ARTICLE) && Array.from(word).length > 2 ? word.slice(ARTICLE.length) : word;
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter('ar', { granularity: 'grapheme' });
    return segmenter.segment(base)[Symbol.iterator]().next().value?.segment ?? '';
  }
  return Array.from(base)[0] ?? '';
}

// The first letters of the first two words of the name, without diacritics: "أحمد سليمان" gives "أس".
export function getAuthorInitials(name: string): string {
  return name
    .replace(DIACRITICS, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(firstLetter)
    .join('');
}

export type AuthorAvatarProps = {
  name: string;
  photoUrl: string | null | undefined;
  size: number;
  priority?: boolean;
  // Inside a link that already says the name (the author card): the photo adds nothing for a screen reader, and an alt
  // equal to the adjacent link text is an axe violation (image-redundant-alt, Task 79).
  decorative?: boolean;
  // The initials block is 96px on the list card and 160px with a ring on the author page.
  variant?: 'card' | 'hero';
};

// The author's photo, or decorative initials when there is none (a blank gradient block before). The initials are
// aria-hidden: the author's name is already the accessible name of the link or heading next to it.
export function AuthorAvatar({
  name,
  photoUrl,
  size,
  priority = false,
  decorative = false,
  variant = 'card',
}: AuthorAvatarProps) {
  if (!photoUrl) {
    const initialsClass =
      variant === 'hero' ? `${styles.initials} ${styles.initialsHero}` : styles.initials;
    return (
      <span aria-hidden="true" className={initialsClass} data-author-initials>
        {getAuthorInitials(name)}
      </span>
    );
  }
  if (decorative) {
    return (
      <SafeImage
        decorative
        height={size}
        priority={priority}
        sizes={`${size}px`}
        src={photoUrl}
        width={size}
      />
    );
  }
  return (
    <SafeImage
      alt={name}
      height={size}
      priority={priority}
      sizes={`${size}px`}
      src={photoUrl}
      width={size}
    />
  );
}
