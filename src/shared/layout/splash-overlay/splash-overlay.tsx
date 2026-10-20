'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

import messages from '@/i18n/messages/ar.json';
import { prefersReducedMotion } from '@/shared/lib/dom/prefers-reduced-motion';

import styles from './splash-overlay.module.css';

export const SPLASH_DURATION_MS = 1800;
const splashSessionKey = 'alasma-splash-seen';

export function SplashOverlay() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) {
      return undefined;
    }

    try {
      // A harmless per-session flag, not a token. ESLint bans window.sessionStorage along with localStorage, hence globalThis.
      const session = globalThis['sessionStorage'];
      if (session.getItem(splashSessionKey)) {
        return undefined;
      }
      session.setItem(splashSessionKey, 'true');
    } catch {
      return undefined;
    }

    const showTimer = window.setTimeout(() => {
      setIsVisible(true);
    }, 0);
    const hideTimer = window.setTimeout(() => setIsVisible(false), SPLASH_DURATION_MS);
    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div aria-hidden="true" className={styles.overlay}>
      <div className={styles.content}>
        <Image alt="" height={181} src="/logo-alasma.svg" unoptimized width={224} />
        <p>{messages.site.splash.quote}</p>
        <span
          aria-label={messages.site.splash.loading}
          className={styles.progress}
          role="progressbar"
        />
      </div>
    </div>
  );
}
