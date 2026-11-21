import type { CSSProperties } from 'react';

import messages from '@/i18n/messages/ar.json';
import { formatNumber } from '@/shared/lib/format';

import styles from './reviews.module.css';

// Read-only stars filled to `rating` of 5 (the value comes from the API; nothing is averaged here).
export function ReviewStars({ rating, small = false }: { rating: number; small?: boolean }) {
  return (
    <span
      aria-label={messages.reviews.starsLabel.replace('{rating}', formatNumber(rating))}
      className={small ? `${styles.stars} ${styles.starsSmall}` : styles.stars}
      role="img"
      style={{ '--rating': rating } as CSSProperties}
    />
  );
}
