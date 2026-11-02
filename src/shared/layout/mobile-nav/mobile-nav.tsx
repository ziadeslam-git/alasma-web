import messages from '@/i18n/messages/ar.json';
import { routes } from '@/shared/config/routes';
import { Icon } from '@/shared/ui/icon';
import { FeatureLink } from '@/shared/ui/soon';

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
      <FeatureLink feature="cart-page" href={routes.cart} label={text.soon}>
        <Icon name="bag" />
        <span>{text.header.cart}</span>
      </FeatureLink>
      <FeatureLink feature="wishlist-heart" href={routes.home} label={text.soon}>
        <Icon name="heart" />
        <span>{text.header.wishlist}</span>
      </FeatureLink>
      <FeatureLink feature="account-area" href={routes.account} label={text.soon}>
        <Icon name="user" />
        <span>{text.header.register}</span>
      </FeatureLink>
    </nav>
  );
}
