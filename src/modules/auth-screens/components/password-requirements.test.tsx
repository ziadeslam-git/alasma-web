import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { axe } from '@/test/axe';

import { passwordRuleChecks, passwordRuleOrder, validateRegister } from '../validation';
import { PasswordRequirements } from './password-requirements';

const text = messages.auth;
const ruleLabels = {
  length: text.passwordRuleLength,
  upper: text.passwordRuleUpper,
  lower: text.passwordRuleLower,
  digit: text.passwordRuleDigit,
} as const;

const item = (rule: keyof typeof ruleLabels) =>
  screen.getByText(ruleLabels[rule]).closest('li') as HTMLElement;
const isMet = (rule: keyof typeof ruleLabels) => item(rule).dataset.met === 'true';

function show(password: string) {
  return render(<PasswordRequirements id="rules" password={password} />);
}

describe('PasswordRequirements', () => {
  it('lists the four rules in Arabic, all unmet for an empty password', () => {
    show('');

    for (const rule of passwordRuleOrder) {
      expect(isMet(rule)).toBe(false);
      expect(within(item(rule)).getByText(text.passwordRuleUnmet)).toBeInTheDocument();
    }
    expect(screen.getByText(text.passwordRulesTitle)).toBeInTheDocument();
    expect(screen.getByText('استوفيت 0 من 4 شروط')).toBeInTheDocument();
  });

  it.each([
    ['length', 'aaaaaaaaaa', { length: true, upper: false, lower: true, digit: false }],
    ['upper', 'A', { length: false, upper: true, lower: false, digit: false }],
    ['lower', 'a', { length: false, upper: false, lower: true, digit: false }],
    ['digit', '7', { length: false, upper: false, lower: false, digit: true }],
  ] as const)('flips the %s rule on its own', (_name, password, expected) => {
    show(password);

    for (const rule of passwordRuleOrder) {
      expect(isMet(rule)).toBe(expected[rule]);
    }
  });

  it('updates as the password changes and states met rules in text, not only by colour', () => {
    const { rerender } = show('Abcdefgh1');

    expect(isMet('length')).toBe(false);

    rerender(<PasswordRequirements id="rules" password="Abcdefgh1x" />);

    for (const rule of passwordRuleOrder) {
      expect(isMet(rule)).toBe(true);
      expect(within(item(rule)).getByText(text.passwordRuleMet)).toBeInTheDocument();
    }
    expect(screen.getByText('استوفيت 4 من 4 شروط')).toBeInTheDocument();
  });

  it('has exactly one live region (the summary), politely', () => {
    const { container } = show('Abc');

    const live = container.querySelectorAll('[aria-live]');

    expect(live).toHaveLength(1);
    expect(live[0]).toHaveAttribute('aria-live', 'polite');
    expect(live[0]).toHaveTextContent('استوفيت 2 من 4 شروط');
  });

  it('shares its rules with the submit-time validation', () => {
    const samples = [
      '',
      'short1A',
      'alllowercase1',
      'ALLUPPERCASE1',
      'NoDigitsHere',
      'Abcdefgh1x',
      'ÀÉÎõü12345',
    ];

    for (const password of samples) {
      const isEveryRuleMet = passwordRuleOrder.every((rule) => passwordRuleChecks[rule](password));
      const error = validateRegister(
        {
          confirmPassword: password,
          email: 'reader@example.com',
          fullName: 'Test Reader',
          password,
          phone: '01012345678',
          terms: true,
        },
        text,
      ).password;

      expect(error === undefined).toBe(isEveryRuleMet);
    }
  });

  it('has no accessibility violations', async () => {
    const { container } = show('Abc');

    expect(await axe(container)).toHaveNoViolations();
  });
});
