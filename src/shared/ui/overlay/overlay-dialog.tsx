'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type ReactNode,
  type SyntheticEvent,
} from 'react';
import { createPortal } from 'react-dom';

import { prefersReducedMotion } from '@/shared/lib/dom/prefers-reduced-motion';
import { scrollLock } from '@/shared/lib/dom/scroll-lock';

import styles from './overlay-dialog.module.css';

export type OverlayRole = 'dialog' | 'alertdialog';

export type OverlayDialogProps = {
  children: ReactNode;
  className: string;
  closeOnBackdrop: boolean;
  closeOnEscape: boolean;
  describedBy?: string | undefined;
  // How long the exit animation lasts, in ms. The dialog is removed by a timer of this length (0 with reduced motion).
  exitDuration: number;
  labelledBy: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  role: OverlayRole;
};

const subscribeNothing = () => () => undefined;

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

// The browser lets Tab leave a modal dialog for its own interface (address bar, tabs), so the wrap-around is done
// here: Tab on the last focusable goes to the first, Shift+Tab on the first goes to the last.
function wrapTabFocus(event: KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== 'Tab') {
    return;
  }

  const dialog = event.currentTarget;
  const focusable = [...dialog.querySelectorAll<HTMLElement>(focusableSelector)].filter(
    (element) => element.getClientRects().length > 0,
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (!first || !last) {
    event.preventDefault();
    return;
  }

  const active = document.activeElement;

  if (event.shiftKey && (active === first || active === dialog)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (active === last || active === dialog)) {
    event.preventDefault();
    first.focus();
  }
}

// The one implementation of the overlay behaviour that Modal and Drawer share. It sits on the native <dialog> opened
// with showModal(): the browser gives the focus trap, the inert background and the top layer. This component adds what
// the browser does not: the controlled open state, the exit animation, the Escape and backdrop rules, a reliable focus
// return, the shared scroll lock and the portal.
export function OverlayDialog({
  children,
  className,
  closeOnBackdrop,
  closeOnEscape,
  describedBy,
  exitDuration,
  labelledBy,
  onOpenChange,
  open,
  role,
}: OverlayDialogProps) {
  const isBrowser = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const pressedOnBackdrop = useRef(false);
  const [isRendered, setIsRendered] = useState(open);
  const [isClosing, setIsClosing] = useState(false);
  const [isPreviouslyOpen, setIsPreviouslyOpen] = useState(open);

  // React to the open prop while rendering, so the dialog is in the DOM for the whole exit animation.
  if (open !== isPreviouslyOpen) {
    setIsPreviouslyOpen(open);

    if (open) {
      setIsRendered(true);
      setIsClosing(false);
    } else if (isRendered) {
      setIsClosing(true);
    }
  }

  useEffect(() => {
    if (!isClosing) {
      return undefined;
    }

    const timer = setTimeout(
      () => {
        setIsRendered(false);
        setIsClosing(false);
      },
      prefersReducedMotion() ? 0 : exitDuration,
    );

    return () => clearTimeout(timer);
  }, [exitDuration, isClosing]);

  // Open the native modal when the element appears; undo everything when it goes.
  useEffect(() => {
    const dialog = dialogRef.current;

    if (!isRendered || !dialog) {
      return undefined;
    }

    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const unlock = scrollLock.lock();
    const { scrollX, scrollY } = window;

    if (!dialog.open) {
      dialog.showModal();
    }

    dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus();

    return () => {
      unlock();

      if (dialog.open) {
        dialog.close();
      }

      if (opener?.isConnected) {
        opener.focus({ preventScroll: true });
      }

      // The browser scrolls the opener into view when it takes focus back. The page cannot scroll while an overlay is
      // open, so the position at close is the position at open: put it back.
      window.scrollTo({ behavior: 'instant', left: scrollX, top: scrollY });
    };
  }, [isRendered]);

  const handleCancel = useCallback(
    (event: SyntheticEvent) => {
      // Always take over from the browser, so the open prop stays the single source of truth.
      event.preventDefault();

      if (closeOnEscape) {
        onOpenChange(false);
      }
    },
    [closeOnEscape, onOpenChange],
  );

  const handleClose = useCallback(() => {
    const dialog = dialogRef.current;

    // The browser closed the dialog on its own (for example a second Escape press): follow the prop.
    if (open && dialog && !dialog.open) {
      if (closeOnEscape) {
        onOpenChange(false);
      } else {
        dialog.showModal();
      }
    }
  }, [closeOnEscape, onOpenChange, open]);

  if (!isBrowser || !isRendered) {
    return null;
  }

  return createPortal(
    <dialog
      aria-describedby={describedBy}
      aria-labelledby={labelledBy}
      aria-modal="true"
      className={`${styles.dialog} ${className}`}
      data-state={isClosing ? 'closing' : 'open'}
      onCancel={handleCancel}
      onClick={(event) => {
        // A click on the backdrop is delivered to the dialog itself; only count a press that also started there.
        if (closeOnBackdrop && pressedOnBackdrop.current && event.target === event.currentTarget) {
          onOpenChange(false);
        }
      }}
      onClose={handleClose}
      onKeyDown={wrapTabFocus}
      onPointerDown={(event) => {
        pressedOnBackdrop.current = event.target === event.currentTarget;
      }}
      ref={dialogRef}
      role={role}
    >
      {children}
    </dialog>,
    document.body,
  );
}
