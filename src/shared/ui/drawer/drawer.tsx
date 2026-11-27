'use client';

import { useId, type ReactNode } from 'react';

import { Button } from '@/shared/ui/button';
import { DRAWER_EXIT_DURATION } from '@/shared/ui/overlay/overlay-constants';
import { OverlayDialog, type OverlayRole } from '@/shared/ui/overlay/overlay-dialog';
import { useControllableOpen } from '@/shared/ui/overlay/use-controllable-open';

import styles from './drawer.module.css';

// 'start' and 'end' are logical: in RTL the start edge is the right one.
export type DrawerSide = 'start' | 'end';

// 'brand' is the dark green sheet of the mobile menu (design .mn__sheet).
// 'sheet' is a bottom sheet (design .fsheet) that rises from the block-end edge at full width.
export type DrawerVariant = 'default' | 'brand' | 'sheet';

export type DrawerProps = {
  children: ReactNode;
  // Optional extra look for the close button; without it the variant decides, so existing drawers are unchanged.
  closeClassName?: string;
  closeLabel: string;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  defaultOpen?: boolean;
  description?: string;
  footer?: ReactNode;
  // Shown in the header instead of the title text (the title stays as the accessible name of the dialog).
  headerLogo?: ReactNode;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  role?: OverlayRole;
  side?: DrawerSide;
  title: string;
  variant?: DrawerVariant;
};

const sideClasses: Record<DrawerSide, string> = {
  start: styles.start ?? '',
  end: styles.end ?? '',
};

// Same behaviour as Modal (focus trap, Escape, backdrop, scroll lock, focus return), as a panel that slides in from
// the inline-start or inline-end edge. For the mobile menu, the filters and the cart.
export function Drawer({
  children,
  closeClassName,
  closeLabel,
  closeOnBackdrop = true,
  closeOnEscape = true,
  defaultOpen = false,
  description,
  footer,
  headerLogo,
  onOpenChange,
  open,
  role = 'dialog',
  side = 'start',
  title,
  variant = 'default',
}: DrawerProps) {
  const [isOpen, setOpen] = useControllableOpen(open, defaultOpen, onOpenChange);
  const titleId = useId();
  const descriptionId = useId();

  return (
    <OverlayDialog
      className={`${styles.drawer} ${sideClasses[side]}${variant === 'sheet' ? ` ${styles.sheet}` : ''}`}
      closeOnBackdrop={closeOnBackdrop}
      closeOnEscape={closeOnEscape}
      describedBy={description ? descriptionId : undefined}
      exitDuration={DRAWER_EXIT_DURATION}
      labelledBy={titleId}
      onOpenChange={setOpen}
      open={isOpen}
      role={role}
    >
      <div className={variant === 'brand' ? `${styles.panel} ${styles.brand}` : styles.panel}>
        <header className={styles.header}>
          {headerLogo ? <div className={styles.logoSlot}>{headerLogo}</div> : null}
          <h2
            className={headerLogo ? `${styles.title} ${styles.srOnly}` : styles.title}
            id={titleId}
          >
            {title}
          </h2>
          <Button
            className={closeClassName ?? (variant === 'brand' ? styles.close : undefined)}
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
