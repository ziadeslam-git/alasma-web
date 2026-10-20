import messages from '@/i18n/messages/ar.json';
import { Field } from '@/shared/ui/field';
import { Icon } from '@/shared/ui/icon';
import { Input } from '@/shared/ui/input';

import styles from '../components.module.css';

export function FieldInputSection() {
  const text = messages.devComponents;

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>{text.field.heading}</h2>
      <div className={styles.grid}>
        <div className={styles.card}>
          <Field hint={text.field.hint} label={text.field.label} required>
            <Input placeholder={text.field.placeholder} />
          </Field>
        </div>
        <div className={styles.card}>
          <Field label={text.field.filledLabel}>
            <Input defaultValue={text.field.filledValue} />
          </Field>
        </div>
        <div className={styles.card}>
          <Field error={text.field.error} label={text.field.label} required>
            <Input defaultValue={text.field.invalidValue} />
          </Field>
        </div>
        <div className={styles.card}>
          <Field label={text.field.disabledLabel}>
            <Input disabled placeholder={text.field.placeholder} />
          </Field>
        </div>
        <div className={styles.card}>
          <Field label={text.field.readOnlyLabel}>
            <Input readOnly value={text.field.filledValue} />
          </Field>
        </div>
        <div className={styles.card}>
          <Field label={text.field.adornmentsLabel}>
            <Input
              endAdornment={<Icon name="search" size="sm" />}
              startAdornment={text.field.adornmentText}
              type="search"
            />
          </Field>
        </div>
      </div>
    </section>
  );
}
