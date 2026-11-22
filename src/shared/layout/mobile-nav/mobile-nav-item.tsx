'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import type { FeatureKey } from '@/shared/config/features';
import { Icon, type IconName } from '@/shared/ui/icon';
import { FeatureLink } from '@/shared/ui/soon';

import styles from './mobile-nav.module.css';

type MobileNavItemProps = {
  badge?: ReactNode;
  // A section item is current on its own path and below it; the home item only on the exact path.
  feature?: FeatureKey;
  href: string;
  icon: IconName;
  // The icon shown while the item is current (the design fills the heart on the wishlist page).
  iconCurrent?: IconName;
  isExact?: boolean;
  label: string;
  soonLabel: string;
  // Paths under these prefixes also make the item current (the account item covers every account page).
  excludePrefixes?: string[];
};

export function MobileNavItem({
  badge,
  excludePrefixes = [],
  feature,
  href,
  icon,
  iconCurrent,
  isExact = false,
  label,
  soonLabel,
}: MobileNavItemProps) {
  const pathname = usePathname() ?? '';
  const isInside = pathname === href || (!isExact && pathname.startsWith(`${href}/`));
  const isExcluded = excludePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const isCurrent = isInside && !isExcluded;
  const content = (
    <>
      <Icon name={isCurrent && iconCurrent ? iconCurrent : icon} />
      {badge}
      <span>{label}</span>
    </>
  );

  if (!feature) {
    return (
      <FeatureLinkLive current={isCurrent} href={href} label={label}>
        {content}
      </FeatureLinkLive>
    );
  }

  return (
    <FeatureLink
      current={isCurrent ? 'page' : undefined}
      feature={feature}
      href={href}
      label={soonLabel}
    >
      {content}
    </FeatureLink>
  );
}

// A plain link for a destination that is not behind a feature flag; the label is the accessible name.
import Link from 'next/link';

function FeatureLinkLive({
  children,
  current,
  href,
  label,
}: {
  children: ReactNode;
  current: boolean;
  href: string;
  label: string;
}) {
  return (
    <Link aria-current={current ? 'page' : undefined} aria-label={label} href={href}>
      {children}
    </Link>
  );
}

export { styles as mobileNavStyles };
