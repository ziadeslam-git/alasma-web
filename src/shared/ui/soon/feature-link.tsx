import Link from 'next/link';
import type { ReactNode } from 'react';

import { isLive, type FeatureKey } from '@/shared/config/features';

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
  return (
    <FeatureGate badge="inline" feature={feature} label={label}>
      {isLive(feature) ? (
        <Link aria-current={current} className={className} href={href}>
          {children}
        </Link>
      ) : (
        <span className={className}>{children}</span>
      )}
    </FeatureGate>
  );
}
