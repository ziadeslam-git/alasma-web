'use client';

import type { ReactNode } from 'react';

import { useResolvedFeatureState } from '@/shared/config/feature-flags';
import type { FeatureKey } from '@/shared/config/features';

import styles from './soon.module.css';

export type SoonBadgePosition = 'corner' | 'inline';

export type SoonProps = {
  badge?: SoonBadgePosition;
  children: ReactNode;
  className?: string;
  feature: FeatureKey;
  label: string;
};

// 'badge' (default) shows a soon feature dimmed with the label; 'hide' renders nothing for it, for places where a
// dimmed placeholder only adds clutter (Tasks 62 and 70). Going live restores the element either way.
export type SoonDisplay = 'badge' | 'hide';

export type FeatureGateProps = {
  badge?: SoonBadgePosition;
  whenSoon?: SoonDisplay;
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
      <span className={styles.badge} data-soon-badge>
        {label}
      </span>
    </div>
  );
}

export function FeatureGate({
  badge,
  children,
  fallback = null,
  feature,
  label,
  whenSoon = 'badge',
}: FeatureGateProps) {
  const state = useResolvedFeatureState(feature);
  if (state === 'hidden') {
    return fallback;
  }

  if (state === 'soon') {
    if (whenSoon === 'hide') {
      return fallback;
    }

    return (
      <Soon badge={badge} feature={feature} label={label}>
        {children}
      </Soon>
    );
  }

  return children;
}
