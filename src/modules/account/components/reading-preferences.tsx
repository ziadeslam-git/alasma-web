import messages from '@/i18n/messages/ar.json';
import { FeatureGate } from '@/shared/ui/soon';

import styles from './profile.module.css';

type PreferenceRowProps = {
  hint: string;
  label: string;
};

function PreferenceRow({ hint, label }: PreferenceRowProps) {
  return (
    <div className={styles.row}>
      <div>
        <b className={styles.rowTitle}>{label}</b>
        <span className={styles.rowHint}>{hint}</span>
      </div>
      <span className={styles.switch}>
        <input aria-label={label} defaultChecked type="checkbox" />
        <i />
      </span>
    </div>
  );
}

// The reading-preferences switches of the design. There is no preferences API, so the card is dimmed with the soon
// label and inert: it never pretends to save anything.
export function ReadingPreferences() {
  const text = messages.account;

  return (
    <FeatureGate feature="reading-preferences" label={messages.site.soon}>
      <section aria-labelledby="preferences-section" className={styles.card}>
        <h2 id="preferences-section">{text.readingPreferences}</h2>
        <div>
          <PreferenceRow hint={text.prefSuggestionsHint} label={text.prefSuggestions} />
          <PreferenceRow hint={text.prefNewsletterHint} label={text.prefNewsletter} />
        </div>
      </section>
    </FeatureGate>
  );
}
