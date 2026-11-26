'use client';

import { useEffect, useState } from 'react';
import messages from '@/i18n/messages/ar.json';
import styles from './payment-method-picker.module.css';

const COPIED_RESET_MS = 2000;

// Copies a transfer number to the clipboard. Client only: it never calls the API.
export function CopyButton({ value }: { value: string }) {
  const [isCopied, setCopied] = useState(false);
  useEffect(() => {
    if (!isCopied) return;
    const timer = setTimeout(() => setCopied(false), COPIED_RESET_MS);
    return () => clearTimeout(timer);
  }, [isCopied]);

  function copy() {
    if (!navigator.clipboard) return;
    void navigator.clipboard
      .writeText(value)
      .then(() => setCopied(true))
      .catch(() => undefined);
  }

  return (
    <button className={styles.copy} onClick={copy} type="button">
      {isCopied ? messages.checkout.copied : messages.checkout.copyNumber}
    </button>
  );
}
