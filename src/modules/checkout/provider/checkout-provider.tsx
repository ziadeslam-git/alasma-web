'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@/modules/auth';
import type { components } from '@/shared/lib/api';
import {
  ATTEMPT_TTL_MS,
  clearAttempt,
  readAttempt,
  writeAttempt,
  type StoredAttempt,
} from './attempt-storage';

type Preview = components['schemas']['CheckoutPreviewDto'];
type PaymentMethod = components['schemas']['PaymentMethod'];
export type PreviewState =
  | { status: 'idle' | 'loading' }
  | { status: 'ok'; data: Preview }
  | { status: 'error'; message: string };
export type CartSignatureLine = { itemId: number; quantity: number };

type CheckoutContextValue = {
  addressId: number | null;
  setAddressId: (value: number | null) => void;
  appliedCouponCode: string | null;
  setAppliedCouponCode: (value: string | null) => void;
  paymentMethod: PaymentMethod | null;
  setPaymentMethod: (value: PaymentMethod | null) => void;
  notes: string;
  setNotes: (value: string) => void;
  preview: PreviewState;
  setPreview: (value: PreviewState) => void;
  isEmailUnconfirmed: boolean;
  setEmailUnconfirmed: (value: boolean) => void;
  beginPreviewRequest: () => number;
  isCurrentPreviewRequest: (version: number) => boolean;
  getPurchaseKey: (lines: CartSignatureLine[]) => Promise<string>;
  clearPurchaseAttempt: () => void;
};

const CheckoutContext = createContext<CheckoutContextValue | null>(null);

async function hashFingerprint(fingerprint: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(fingerprint));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const [addressId, setAddressIdState] = useState<number | null>(null);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [notes, setNotes] = useState('');
  const [preview, setPreview] = useState<PreviewState>({ status: 'idle' });
  const [isEmailUnconfirmed, setEmailUnconfirmed] = useState(false);
  const attempt = useRef<StoredAttempt | null>(null);
  const previewVersion = useRef(0);
  const beginPreviewRequest = useCallback(() => ++previewVersion.current, []);
  const isCurrentPreviewRequest = useCallback(
    (version: number) => version === previewVersion.current,
    [],
  );
  const setAddressId = useCallback((value: number | null) => {
    previewVersion.current += 1;
    setAddressIdState(value);
  }, []);
  const previousUser = useRef<number | null>(null);
  const clearPurchaseAttempt = useCallback(() => {
    attempt.current = null;
    clearAttempt();
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    const userId = user?.id ?? null;
    if (userId === null || (previousUser.current !== null && previousUser.current !== userId))
      clearPurchaseAttempt();
    previousUser.current = userId;
  }, [clearPurchaseAttempt, status, user?.id]);

  const getPurchaseKey = useCallback(
    async (lines: CartSignatureLine[]) => {
      if (!user) throw new Error('A user is required for a purchase attempt');
      const signature = [...lines]
        .sort((a, b) => a.itemId - b.itemId)
        .map(({ itemId, quantity }) => ({ itemId, quantity }));
      const fingerprintHash = await hashFingerprint(
        JSON.stringify({
          userId: user.id,
          addressId,
          appliedCouponCode,
          paymentMethod,
          notes,
          lines: signature,
        }),
      );
      const now = Date.now();
      const current = attempt.current ?? readAttempt(now);
      if (
        current &&
        current.fingerprintHash === fingerprintHash &&
        now - current.createdAt < ATTEMPT_TTL_MS &&
        current.createdAt <= now
      ) {
        attempt.current = current;
        return current.key;
      }
      clearAttempt();
      const next = { key: crypto.randomUUID(), fingerprintHash, createdAt: now };
      attempt.current = next;
      writeAttempt(next);
      return next.key;
    },
    [user, addressId, appliedCouponCode, paymentMethod, notes],
  );

  const value = useMemo(
    () => ({
      addressId,
      setAddressId,
      appliedCouponCode,
      setAppliedCouponCode,
      paymentMethod,
      setPaymentMethod,
      notes,
      setNotes,
      preview,
      setPreview,
      isEmailUnconfirmed,
      setEmailUnconfirmed,
      beginPreviewRequest,
      isCurrentPreviewRequest,
      getPurchaseKey,
      clearPurchaseAttempt,
    }),
    [
      addressId,
      appliedCouponCode,
      paymentMethod,
      notes,
      preview,
      isEmailUnconfirmed,
      getPurchaseKey,
      clearPurchaseAttempt,
      beginPreviewRequest,
      isCurrentPreviewRequest,
      setAddressId,
    ],
  );
  return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>;
}

export function useCheckout(): CheckoutContextValue {
  const value = useContext(CheckoutContext);
  if (!value) throw new Error('useCheckout must be used inside CheckoutProvider');
  return value;
}
