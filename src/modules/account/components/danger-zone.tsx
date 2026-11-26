import messages from '@/i18n/messages/ar.json';
import { Button } from '@/shared/ui/button';
import { FeatureGate } from '@/shared/ui/soon';

import styles from './profile.module.css';

// The danger zone of the design. There is no delete-account endpoint, so the card is dimmed with the soon label and
// the button does nothing.
export function DangerZone() {
  const text = messages.account;

  return (
    <FeatureGate feature="account-delete" label={messages.site.soon}>
      <section aria-labelledby="danger-section" className={`${styles.card} ${styles.danger}`}>
        <h2 id="danger-section">{text.dangerZone}</h2>
        <div className={styles.row}>
          <div>
            <b className={styles.rowTitle}>{text.deleteAccount}</b>
            <span className={styles.rowHint}>{text.deleteAccountHint}</span>
          </div>
          <Button className={styles.dangerButton} leadingIcon="trash" size="sm" variant="outline">
            {text.deleteAccount}
          </Button>
        </div>
      </section>
    </FeatureGate>
  );
}
