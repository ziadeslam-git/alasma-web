'use client';

import { useId, type ReactNode } from 'react';

import { Button } from '@/shared/ui/button';
import { MODAL_EXIT_DURATION } from '@/shared/ui/overlay/overlay-constants';
import { OverlayDialog, type OverlayRole } from '@/shared/ui/overlay/overlay-dialog';
import { useControllableOpen } from '@/shared/ui/overlay/use-controllable-open';

import styles from './modal.module.css';

export type ModalSize = 'sm' | 'md' | 'lg';

export type ModalProps = {
  children: ReactNode;
  // Label of the close button (Arabic text comes from the caller / i18n).
  closeLabel: string;
  // false for a blocking dialog the user must answer with a button.
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  defaultOpen?: boolean;
  description?: string;
  footer?: ReactNode;
  onOpenChange?: (open: boolean) => void;
  // Controlled when given. Otherwise the modal keeps its own state (defaultOpen).
  open?: boolean;
  // 'alertdialog' for confirmations that need an answer.
  role?: OverlayRole;
  size?: ModalSize;
  title: string;
};

const sizeClasses: Record<ModalSize, string> = {
  sm: styles.sm ?? '',
  md: styles.md ?? '',
  lg: styles.lg ?? '',
};

// Put `data-autofocus` on the element that should receive focus when the modal opens; otherwise the first focusable
// element does. A Server Component page must not pass functions to a Modal: keep the open state in a small client
// wrapper and render the Modal there.
export function Modal({
  children,
  closeLabel,
  closeOnBackdrop = true,
  closeOnEscape = true,
  defaultOpen = false,
  description,
  footer,
  onOpenChange,
  open,
  role = 'dialog',
  size = 'md',
  title,
}: ModalProps) {
  const [isOpen, setOpen] = useControllableOpen(open, defaultOpen, onOpenChange);
  const titleId = useId();
  const descriptionId = useId();

  return (
    <OverlayDialog
      className={`${styles.modal} ${sizeClasses[size]}`}
      closeOnBackdrop={closeOnBackdrop}
      closeOnEscape={closeOnEscape}
      describedBy={description ? descriptionId : undefined}
      exitDuration={MODAL_EXIT_DURATION}
      labelledBy={titleId}
      onOpenChange={setOpen}
      open={isOpen}
      role={role}
    >
      <div className={styles.panel}>
        <header className={styles.header}>
          <h2 className={styles.title} id={titleId}>
            {title}
          </h2>
          <Button
            label={closeLabel}
            leadingIcon="x"
            onClick={() => setOpen(false)}
            size="sm"
            variant="ghost"
          />
        </header>
        {description ? (
          <p className={styles.description} id={descriptionId}>
            {description}
          </p>
        ) : null}
        <div className={styles.body}>{children}</div>
        {footer ? <footer className={styles.footer}>{footer}</footer> : null}
      </div>
    </OverlayDialog>
  );
}
