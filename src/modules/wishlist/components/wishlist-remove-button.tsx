'use client';

import messages from '@/i18n/messages/ar.json';
import { Icon } from '@/shared/ui/icon';

import styles from './wishlist.module.css';

export function WishlistRemoveButton({ title, onRemove }: { title: string; onRemove: () => void }) {
  return (
    <button
      aria-label={messages.wishlist.remove.replace('{title}', title)}
      className={styles.remove}
      onClick={onRemove}
      type="button"
    >
      <Icon name="heart-f" size="sm" />
    </button>
  );
}
