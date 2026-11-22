import type { ReactNode } from 'react';

import messages from '@/i18n/messages/ar.json';
import { Icon } from '@/shared/ui/icon';
import { FeatureGate } from '@/shared/ui/soon';

import { AccountNav } from './account-nav';
import styles from './account.module.css';

// The reading goal of the design has no API, so it is shown dimmed with the soon label: a title and an empty bar, no numbers.
function ReadingGoal() {
  return (
    <FeatureGate badge="inline" feature="reading-goal" label={messages.site.soon}>
      <div className={styles.goal}>
        <Icon name="book-open" />
        <div className={styles.goalBody}>
          <span>{messages.account.readingGoal}</span>
          <span aria-hidden="true" className={styles.goalBar} />
        </div>
      </div>
    </FeatureGate>
  );
}

export function AccountShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <AccountNav footer={<ReadingGoal />} />
      <main className={styles.main} id="main-content">
        {children}
      </main>
    </div>
  );
}
