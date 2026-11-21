import messages from '@/i18n/messages/ar.json';

import styles from './reviews.module.css';

// The design's sort control. The API only returns the newest first, so the control is shown inert (soon).
export function ReviewsSort() {
  const text = messages.reviews;
  return (
    <label className={styles.sort}>
      {text.sortLabel}
      <select className={styles.sortSelect} disabled>
        <option>{text.sortNewest}</option>
      </select>
    </label>
  );
}
