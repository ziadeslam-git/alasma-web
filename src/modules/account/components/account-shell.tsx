import Link from 'next/link';
import type { ReactNode } from 'react';

import messages from '@/i18n/messages/ar.json';
import { routes } from '@/shared/config/routes';
import { FeatureGate } from '@/shared/ui/soon';

import styles from './account.module.css';

export function AccountShell({ children }: { children: ReactNode }) {
  const text = messages.account;
  return (
    <div className={styles.shell}>
      <nav aria-label={text.navigation} className={styles.navigation}>
        <Link href={routes.account}>{text.overview}</Link>
        <Link href={routes.accountAddresses}>{text.addresses}</Link>
        <Link href={routes.accountOrders}>{text.orders}</Link>
        <FeatureGate badge="inline" feature="wishlist-heart" label={messages.site.soon}>
          <span>{text.wishlist}</span>
        </FeatureGate>
        <FeatureGate badge="inline" feature="profile-edit" label={messages.site.soon}>
          <span>{text.editProfile}</span>
        </FeatureGate>
      </nav>
      <main className={styles.main} id="main-content">
        {children}
      </main>
    </div>
  );
}
