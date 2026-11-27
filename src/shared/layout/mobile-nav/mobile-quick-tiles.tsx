'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import messages from '@/i18n/messages/ar.json';
import { routes } from '@/shared/config/routes';
import { Icon } from '@/shared/ui/icon';
import { FeatureLink } from '@/shared/ui/soon';

import styles from './mobile-nav.module.css';

type MobileQuickTilesProps = {
  // The account tile comes from the account module (it needs the session: account when signed in, login otherwise),
  // and the cart count badge from the cart module; shared cannot import a module.
  accountTile?: ReactNode;
  cartBadge?: ReactNode;
};

// The three quick tiles at the top of the phone menu (design .mn__qs / .mn__q): account, wishlist, cart with its count.
export function MobileQuickTiles({ accountTile, cartBadge }: MobileQuickTilesProps) {
  const pathname = usePathname() ?? '';
  const text = messages.site;
  const isWishlist =
    pathname === routes.accountWishlist || pathname.startsWith(`${routes.accountWishlist}/`);
  const isCart = pathname === routes.cart || pathname.startsWith(`${routes.cart}/`);

  return (
    <div className={styles.tiles}>
      {accountTile}
      <FeatureLink
        current={isWishlist ? 'page' : undefined}
        feature="wishlist-heart"
        href={routes.accountWishlist}
        label={text.soon}
      >
        <Icon name={isWishlist ? 'heart-f' : 'heart'} />
        <span>{text.header.wishlist}</span>
      </FeatureLink>
      <FeatureLink
        current={isCart ? 'page' : undefined}
        feature="cart-page"
        href={routes.cart}
        label={text.soon}
      >
        <Icon name="bag" />
        <span>{text.header.cart}</span>
        {cartBadge ? <span className={styles.tileCount}>{cartBadge}</span> : null}
      </FeatureLink>
    </div>
  );
}
