'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

import { useIsFeatureLive } from '@/shared/config/feature-flags';
import type { FeatureKey } from '@/shared/config/features';

import { FeatureGate } from './soon';

type FeatureLinkProps = {
  children: ReactNode;
  className?: string;
  feature: FeatureKey;
  href: string;
  label: string;
  current?: 'page' | 'true' | undefined;
};

export function FeatureLink({
  children,
  className,
  feature,
  href,
  label,
  current,
}: FeatureLinkProps) {
  const isFeatureLive = useIsFeatureLive(feature);

  return (
    <FeatureGate badge="inline" feature={feature} label={label}>
      {isFeatureLive ? (
        <Link aria-current={current} className={className} href={href}>
          {children}
        </Link>
      ) : (
        <span className={className}>{children}</span>
      )}
    </FeatureGate>
  );
}
