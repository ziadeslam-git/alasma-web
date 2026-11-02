import messages from '@/i18n/messages/ar.json';
import { FeatureGate } from '@/shared/ui/soon';

import styles from './account.module.css';

export function UnconfirmedEmailBanner() {
  return (
    <section className={styles.notice} aria-label={messages.account.unconfirmed}>
      <p>{messages.account.unconfirmed}</p>
      <FeatureGate badge="inline" feature="resend-confirmation" label={messages.site.soon}>
        <span>{messages.account.resend}</span>
      </FeatureGate>
    </section>
  );
}
