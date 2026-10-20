'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { prefersReducedMotion } from '@/shared/lib/dom/prefers-reduced-motion';
import { Icon, type IconName } from '@/shared/ui/icon';

import { TOAST_EXIT_DURATION } from './toast-constants';
import type { ToastKind } from './toast-provider';
import styles from './toast.module.css';

type ToastItem = {
  closeLabel: string;
  duration?: number;
  id: number;
  kind: ToastKind;
  message: string;
};

type ToastViewportProps = {
  label: string;
  onDismiss: (id: number) => void;
  toasts: ToastItem[];
};

const iconNames: Record<ToastKind, IconName> = {
  success: 'check',
  error: 'help',
  info: 'bulb',
  warning: 'bell',
};

export function ToastViewport({ label, onDismiss, toasts }: ToastViewportProps) {
  return (
    <div aria-label={label} className={styles.viewport} role="region">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} onDismiss={onDismiss} toast={toast} />
      ))}
    </div>
  );
}

// Auto-dismiss countdown that can be paused (hover, keyboard focus) and resumed. The toast leaves through timers only:
// after the countdown it plays the exit animation for TOAST_EXIT_DURATION, or goes at once with reduced motion.
function useToastLifecycle(toast: ToastItem, onDismiss: (id: number) => void) {
  const [isLeaving, setIsLeaving] = useState(false);
  const remaining = useRef(toast.duration ?? 0);
  const startedAt = useRef(0);
  const countdown = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exit = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLeft = useRef(false);
  const holds = useRef({ focus: false, hover: false });
  const { id } = toast;

  const stop = useCallback(() => {
    if (countdown.current) {
      clearTimeout(countdown.current);
      countdown.current = null;
    }
  }, []);

  const leave = useCallback(() => {
    if (hasLeft.current) {
      return;
    }

    hasLeft.current = true;
    stop();

    if (prefersReducedMotion()) {
      onDismiss(id);
      return;
    }

    setIsLeaving(true);
    exit.current = setTimeout(() => onDismiss(id), TOAST_EXIT_DURATION);
  }, [id, onDismiss, stop]);

  const start = useCallback(() => {
    if (hasLeft.current || countdown.current || remaining.current <= 0) {
      return;
    }

    startedAt.current = Date.now();
    countdown.current = setTimeout(leave, remaining.current);
  }, [leave]);

  const hold = useCallback(
    (source: 'focus' | 'hover') => {
      holds.current[source] = true;
      if (countdown.current) {
        remaining.current -= Date.now() - startedAt.current;
        stop();
      }
    },
    [stop],
  );

  const release = useCallback(
    (source: 'focus' | 'hover') => {
      holds.current[source] = false;
      if (!holds.current.focus && !holds.current.hover) {
        start();
      }
    },
    [start],
  );

  useEffect(() => {
    start();

    return () => {
      stop();
      if (exit.current) {
        clearTimeout(exit.current);
      }
    };
  }, [start, stop]);

  return { hold, isLeaving, leave, release };
}

function ToastItem({ onDismiss, toast }: { onDismiss: (id: number) => void; toast: ToastItem }) {
  const { hold, isLeaving, leave, release } = useToastLifecycle(toast, onDismiss);

  const role = toast.kind === 'error' || toast.kind === 'warning' ? 'alert' : 'status';
  return (
    <div
      className={`${styles.toast} ${styles[toast.kind] ?? ''} ${isLeaving ? styles.leaving : ''}`}
      onBlur={() => release('focus')}
      onFocus={() => hold('focus')}
      onMouseEnter={() => hold('hover')}
      onMouseLeave={() => release('hover')}
      role={role}
    >
      <span aria-hidden="true" className={styles.iconWrap}>
        <Icon name={iconNames[toast.kind]} size="sm" />
      </span>
      <span className={styles.message}>{toast.message}</span>
      <button aria-label={toast.closeLabel} className={styles.close} onClick={leave} type="button">
        <Icon name="x" size="sm" />
      </button>
    </div>
  );
}
