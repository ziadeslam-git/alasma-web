import type { ReactNode } from 'react';

import messages from '@/i18n/messages/ar.json';
import { routes } from '@/shared/config/routes';

import { MobileNavItem } from './mobile-nav-item';
import styles from './mobile-nav.module.css';

// cartBadge is the cart module's count badge, passed in by the layout because shared cannot import a module.
export function MobileNav({ cartBadge }: { cartBadge?: ReactNode }) {
  const text = messages.site;

  return (
    <nav aria-label={text.header.menu} className={styles.appBar}>
      <MobileNavItem
        href={routes.home}
        icon="lib"
        isExact
        label={text.header.home}
        soonLabel={text.soon}
      />
      <MobileNavItem
        href={routes.books}
        icon="book"
        label={text.header.store}
        soonLabel={text.soon}
      />
      <MobileNavItem
        badge={cartBadge}
        feature="cart-page"
        href={routes.cart}
        icon="bag"
        label={text.header.cart}
        soonLabel={text.soon}
      />
      <MobileNavItem
        feature="wishlist-heart"
        href={routes.accountWishlist}
        icon="heart"
        iconCurrent="heart-f"
        label={text.header.wishlist}
        soonLabel={text.soon}
      />
      <MobileNavItem
        excludePrefixes={[routes.accountWishlist]}
        feature="account-area"
        href={routes.account}
        icon="user"
        label={messages.account.title}
        soonLabel={text.soon}
      />
    </nav>
  );
}
