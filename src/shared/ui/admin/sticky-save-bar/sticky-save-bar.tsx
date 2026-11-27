'use client';

import messages from '@/i18n/messages/ar.json';
import { Button } from '@/shared/ui/button';

import styles from './sticky-save-bar.module.css';

const copy = messages.admin.saveBar;

export type StickySaveBarProps = {
  isDirty: boolean;
  isSaving?: boolean;
  onRevert: () => void;
  onSave: () => void;
};

// Only exists while there is something to save. While saving, both buttons are disabled (no double save, no revert
// under a request that is already in flight).
export function StickySaveBar({ isDirty, isSaving = false, onRevert, onSave }: StickySaveBarProps) {
  if (!isDirty) return null;

  return (
    <div aria-label={copy.label} className={styles.bar} role="region">
      <p className={styles.message} role="status">
        {isSaving ? copy.saving : copy.unsaved}
      </p>
      <div className={styles.actions}>
        <Button disabled={isSaving} onClick={onRevert} variant="ghost">
          {copy.revert}
        </Button>
        <Button loading={isSaving} onClick={() => !isSaving && onSave()}>
          {copy.save}
        </Button>
      </div>
    </div>
  );
}
