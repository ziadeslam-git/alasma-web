import Image from 'next/image';
import type { ReactNode } from 'react';

import messages from '@/i18n/messages/ar.json';

import styles from './auth-split.module.css';

// The split-screen shell of every auth page: a brand panel (desktop only) beside the form panel.
// The page content (AuthCard) goes into the <main> of the form panel.
export function AuthSplit({ children }: { children: ReactNode }) {
  const text = messages.auth;

  return (
    <div className={styles.split}>
      <aside className={styles.brand}>
        <Image
          alt={messages.site.brand}
          className={styles.logo}
          height={136}
          priority
          src="/logo-alasma.svg"
          unoptimized
          width={168}
        />
        <span aria-hidden="true" className={`${styles.feather} ${styles.featherBackdrop}`} />
        <span aria-hidden="true" className={`${styles.feather} ${styles.featherFly}`} />
        <div className={styles.pitch}>
          <q className={styles.quote}>{text.brandQuote}</q>
          <p className={styles.lead}>{text.brandLead}</p>
        </div>
        <span className={styles.copyright}>{text.brandCopyright}</span>
      </aside>
      <main className={styles.formPanel} id="main-content">
        {children}
      </main>
    </div>
  );
}
