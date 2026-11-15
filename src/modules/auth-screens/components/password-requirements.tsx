import messages from '@/i18n/messages/ar.json';
import { Icon } from '@/shared/ui/icon';

import { passwordRuleChecks, passwordRuleOrder, type PasswordRuleId } from '../validation';
import styles from './password-requirements.module.css';

const ruleText: Record<PasswordRuleId, string> = {
  length: messages.auth.passwordRuleLength,
  upper: messages.auth.passwordRuleUpper,
  lower: messages.auth.passwordRuleLower,
  digit: messages.auth.passwordRuleDigit,
};

export type PasswordRequirementsProps = {
  id: string;
  password: string;
};

// Live checklist of the password rules. The rules come from validation.ts (passwordRuleChecks), the same checks the
// submit-time validation uses. Each item states its status in text (never colour alone); only the summary is a live
// region, so a screen reader hears one short update when the count changes, not one per keystroke.
export function PasswordRequirements({ id, password }: PasswordRequirementsProps) {
  const text = messages.auth;
  const results = passwordRuleOrder.map((ruleId) => ({
    isMet: passwordRuleChecks[ruleId](password),
    ruleId,
  }));
  const metCount = results.filter((result) => result.isMet).length;
  const summary = text.passwordRulesSummary
    .replace('{met}', String(metCount))
    .replace('{total}', String(results.length));

  return (
    <div className={styles.requirements} id={id}>
      <p className={styles.title} id={`${id}-title`}>
        {text.passwordRulesTitle}
      </p>
      <ul aria-labelledby={`${id}-title`} className={styles.list}>
        {results.map(({ isMet, ruleId }) => (
          <li className={isMet ? styles.met : styles.unmet} data-met={isMet} key={ruleId}>
            <Icon name={isMet ? 'check-c' : 'minus'} size="sm" />
            <span>{ruleText[ruleId]}</span>
            <span className={styles.srOnly}>
              {isMet ? text.passwordRuleMet : text.passwordRuleUnmet}
            </span>
          </li>
        ))}
      </ul>
      <p aria-live="polite" className={styles.summary}>
        {summary}
      </p>
    </div>
  );
}
