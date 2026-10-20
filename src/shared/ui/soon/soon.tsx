import type { ReactNode } from 'react';

import { getFeatureState, type FeatureKey } from '@/shared/config/features';

import styles from './soon.module.css';

export type SoonBadgePosition = 'corner' | 'inline';

export type SoonProps = {
  badge?: SoonBadgePosition;
  children: ReactNode;
  className?: string;
  feature: FeatureKey;
  label: string;
};

export type FeatureGateProps = {
  children: ReactNode;
  fallback?: ReactNode;
  feature: FeatureKey;
  label: string;
};

export function Soon({ badge = 'corner', children, className, feature, label }: SoonProps) {
  const wrapperClassName = [styles.soon, styles[badge] ?? '', className].filter(Boolean).join(' ');

  return (
    <div aria-disabled="true" className={wrapperClassName} data-feature={feature} inert>
      {children}
      <span className={styles.badge}>{label}</span>
    </div>
  );
}

export function FeatureGate({ children, fallback = null, feature, label }: FeatureGateProps) {
  const state = getFeatureState(feature);
  if (state === 'hidden') {
    return fallback;
  }

  if (state === 'soon') {
    return (
      <Soon feature={feature} label={label}>
        {children}
      </Soon>
    );
  }

  return children;
}
