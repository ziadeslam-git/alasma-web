'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import messages from '@/i18n/messages/ar.json';
import { routes } from '@/shared/config/routes';
import type { FeatureKey } from '@/shared/config/features';
import { Icon, type IconName } from '@/shared/ui/icon';
import { FeatureGate } from '@/shared/ui/soon';

import styles from './account.module.css';

type NavItem = {
  href: string;
  icon: IconName;
  label: string;
  // The overview matches only itself; the other entries also match their sub-pages.
  isExact?: boolean;
  // A feature that is still soon leaves the entry out ('hide') or shows it dimmed with the soon label ('badge').
  feature?: FeatureKey;
  whenSoon?: 'hide' | 'badge';
};

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isCurrent = item.isExact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
  const link = (
    <Link aria-current={isCurrent ? 'page' : undefined} href={item.href}>
      <Icon name={item.icon} size="sm" />
      {item.label}
    </Link>
  );
  if (!item.feature) return link;
  return (
    <FeatureGate
      badge="inline"
      feature={item.feature}
      label={messages.site.soon}
      whenSoon={item.whenSoon ?? 'hide'}
    >
      {link}
    </FeatureGate>
  );
}

// The sidebar of design/account.css (.sb): two titled groups with icons, the current page as a filled pill, and the
// reading-goal card, which has no API and stays soon. On phones it becomes a row of pills.
export function AccountNav({ footer }: { footer?: ReactNode }) {
  const text = messages.account;
  const pathname = usePathname() ?? '';
  const menu: NavItem[] = [
    { href: routes.account, icon: 'dash', label: text.overview, isExact: true },
    {
      href: routes.accountWishlist,
      icon: 'heart',
      label: text.wishlist,
      feature: 'wishlist-heart',
    },
    { href: routes.accountOrders, icon: 'package', label: text.orders },
  ];
  const settings: NavItem[] = [
    { href: routes.accountProfile, icon: 'user', label: text.editProfile, feature: 'profile-edit' },
    { href: routes.accountAddresses, icon: 'pin', label: text.addresses },
  ];
  return (
    <nav aria-label={text.navigation} className={styles.navigation}>
      <h2 className={styles.navTitle}>{text.menuSection}</h2>
      {menu.map((item) => (
        <NavLink item={item} key={item.href} pathname={pathname} />
      ))}
      <hr className={styles.navDivider} />
      <h2 className={styles.navTitle}>{text.settingsSection}</h2>
      {settings.map((item) => (
        <NavLink item={item} key={item.href} pathname={pathname} />
      ))}
      <FeatureGate
        badge="inline"
        feature="notifications-center"
        label={messages.site.soon}
        whenSoon="badge"
      >
        <span className={styles.navSoon}>
          <Icon name="bell" size="sm" />
          {text.notifications}
        </span>
      </FeatureGate>
      {footer}
    </nav>
  );
}
