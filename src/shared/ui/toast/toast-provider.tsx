'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { DEFAULT_MAX_VISIBLE_TOASTS, DEFAULT_TOAST_DURATION } from './toast-constants';
import { ToastViewport } from './toast-viewport';

export { DEFAULT_MAX_VISIBLE_TOASTS, DEFAULT_TOAST_DURATION };

export type ToastKind = 'success' | 'error' | 'info' | 'warning';

export type ToastOptions = {
  closeLabel: string;
  duration?: number;
  kind: ToastKind;
};

type ToastRecord = ToastOptions & {
  id: number;
  message: string;
};

type ToastContextValue = {
  show: (message: string, options: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export type ToastProviderProps = {
  children: ReactNode;
  label: string;
  maxVisible?: number;
};

export function ToastProvider({
  children,
  label,
  maxVisible = DEFAULT_MAX_VISIBLE_TOASTS,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const show = useCallback(
    (message: string, options: ToastOptions) => {
      const toast: ToastRecord = {
        ...options,
        duration: options.duration ?? DEFAULT_TOAST_DURATION,
        id: Date.now() + Math.random(),
        message,
      };
      setToasts((current) => [...current, toast].slice(-maxVisible));
    },
    [maxVisible],
  );
  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);
  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport label={label} onDismiss={dismiss} toasts={toasts} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider.');
  }

  return context;
}
