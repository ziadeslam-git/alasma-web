import Link from 'next/link';

import messages from '@/i18n/messages/ar.json';
import { staticPageRoute } from '@/shared/config/routes';

import styles from './policy-nav.module.css';

export const POLICY_PAGE_KEYS = [
  'shipping-policy',
  'return-policy',
  'privacy-policy',
  'terms',
] as const;

const labels: Record<(typeof POLICY_PAGE_KEYS)[number], string> = {
  'shipping-policy': messages.pages.policies.shipping,
  'return-policy': messages.pages.policies.returns,
  'privacy-policy': messages.pages.policies.privacy,
  terms: messages.pages.policies.terms,
};

export function isPolicyKey(key: string): key is (typeof POLICY_PAGE_KEYS)[number] {
  return POLICY_PAGE_KEYS.some((policyKey) => policyKey === key);
}

export function PolicyNav({ activeKey }: { activeKey: string }) {
  return (
    <nav className={styles.nav} aria-label={messages.pages.policies.navLabel}>
      {POLICY_PAGE_KEYS.map((key) => (
        <Link
          key={key}
          href={staticPageRoute(key)}
          aria-current={key === activeKey ? 'page' : undefined}
        >
          {labels[key]}
        </Link>
      ))}
    </nav>
  );
}
