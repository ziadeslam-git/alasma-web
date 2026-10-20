import Link from 'next/link';

import messages from '@/i18n/messages/ar.json';
import { routes } from '@/shared/config/routes';
import { Icon } from '@/shared/ui/icon';
import { FeatureGate } from '@/shared/ui/soon';

import { MobileNavActiveLink } from './mobile-nav-active-link';
import styles from './mobile-nav.module.css';

export function MobileNav() {
  const text = messages.site;

  return (
    <nav aria-label={text.header.menu} className={styles.appBar}>
      <MobileNavActiveLink href={routes.home} label={text.header.home}>
        <Icon name="lib" />
        <span>{text.header.home}</span>
      </MobileNavActiveLink>
      <MobileNavActiveLink href={routes.books} label={text.header.store}>
        <Icon name="book" />
        <span>{text.header.store}</span>
      </MobileNavActiveLink>
      <FeatureGate feature="cart-page" label={text.soon}>
        <Link aria-label={text.header.cart} href={routes.cart}>
          <Icon name="bag" />
          <span>{text.header.cart}</span>
        </Link>
      </FeatureGate>
      <FeatureGate feature="wishlist-heart" label={text.soon}>
        <Link aria-label={text.header.wishlist} href={routes.home}>
          <Icon name="heart" />
          <span>{text.header.wishlist}</span>
        </Link>
      </FeatureGate>
      <FeatureGate feature="account-area" label={text.soon}>
        <Link aria-label={text.header.register} href={routes.account}>
          <Icon name="user" />
          <span>{text.header.register}</span>
        </Link>
      </FeatureGate>
    </nav>
  );
}
