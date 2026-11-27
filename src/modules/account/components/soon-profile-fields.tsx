import messages from '@/i18n/messages/ar.json';
import { Input, Select } from '@/shared/ui/input';
import { FeatureGate } from '@/shared/ui/soon';

import styles from './profile.module.css';

// Birth date and preferred language of the design: GET/PUT /me has neither field, so the pair is shown dimmed with the
// soon label and cannot be used. (First and last name are not shown: the API has one fullName, which stays above.)
export function SoonProfileFields() {
  const text = messages.account;

  return (
    <div className={styles.wide}>
      <FeatureGate feature="profile-extra-fields" label={messages.site.soon}>
        <div className={styles.pair}>
          <label>
            {text.birthDate}
            <Input defaultValue="" type="date" />
          </label>
          <label>
            {text.preferredLanguageLabel}
            <Select defaultValue="ar">
              <option value="ar">{text.languageArabic}</option>
            </Select>
          </label>
        </div>
      </FeatureGate>
    </div>
  );
}
