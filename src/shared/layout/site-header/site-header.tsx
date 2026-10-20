import Link from 'next/link';
import type { ReactNode } from 'react';

import messages from '@/i18n/messages/ar.json';
import { routes, staticPageRoute } from '@/shared/config/routes';
import { MobileNavMenu } from '@/shared/layout/mobile-nav';
import { ButtonLink } from '@/shared/ui/button';
import { Icon } from '@/shared/ui/icon';
import { FeatureGate } from '@/shared/ui/soon';

import styles from './site-header.module.css';

export type SiteHeaderProps = {
  accountArea?: ReactNode;
};

export function SiteHeader({ accountArea }: SiteHeaderProps) {
  const text = messages.site;
  const guestLinks = (
    <div className={styles.guestLinks}>
      <ButtonLink href={routes.login} size="sm" variant="ghost">
        {text.header.login}
      </ButtonLink>
      <ButtonLink href={routes.register} size="sm" variant="outline">
        {text.header.register}
      </ButtonLink>
    </div>
  );

  return (
    <header className={styles.header}>
      <a className={styles.skipLink} href="#main-content">
        {text.skipToContent}
      </a>
      <div className={styles.wrap}>
        <Link aria-label={text.brand} className={styles.logo} href={routes.home}>
          {text.brand}
        </Link>
        <form action={routes.books} className={styles.search} method="get" role="search">
          <Icon name="search" />
          <input
            aria-label={text.search.label}
            name="q"
            placeholder={text.search.placeholder}
            type="search"
          />
        </form>
        <nav aria-label={text.header.home} className={styles.links}>
          <Link href={routes.home}>{text.header.home}</Link>
          <Link href={routes.books}>{text.header.store}</Link>
          <FeatureGate feature="home-most-popular" label={text.soon}>
            <span>{text.header.bestSellers}</span>
          </FeatureGate>
          <FeatureGate feature="offers-bundles" label={text.soon}>
            <span>{text.header.offers}</span>
          </FeatureGate>
          <Link href={routes.authors}>{text.header.authors}</Link>
          <FeatureGate feature="home-events" label={text.soon}>
            <span>{text.header.events}</span>
          </FeatureGate>
          <Link href={routes.categories}>{text.header.categories}</Link>
        </nav>
        <div className={styles.actions}>
          <FeatureGate feature="wishlist-heart" label={text.soon}>
            <Link aria-label={text.header.wishlist} className={styles.iconLink} href={routes.home}>
              <Icon name="heart" />
            </Link>
          </FeatureGate>
          <FeatureGate feature="cart-page" label={text.soon}>
            <Link aria-label={text.header.cart} className={styles.iconLink} href={routes.cart}>
              <Icon name="bag" />
            </Link>
          </FeatureGate>
          <FeatureGate feature="notifications-center" label={text.soon}>
            <span aria-label={text.header.notifications} className={styles.iconLink}>
              <Icon name="bell" />
            </span>
          </FeatureGate>
          <FeatureGate feature="language-switch-en" label={text.soon}>
            <span className={styles.language}>{text.header.english}</span>
          </FeatureGate>
          {accountArea ?? guestLinks}
        </div>
        <MobileNavMenu
          closeLabel={text.header.closeMenu}
          label={text.header.menu}
          title={text.header.menu}
        >
          <nav aria-label={text.header.menu} className={styles.menuLinks}>
            <Link href={routes.home}>{text.header.home}</Link>
            <Link href={routes.books}>{text.header.store}</Link>
            <Link href={routes.authors}>{text.header.authors}</Link>
            <Link href={routes.categories}>{text.header.categories}</Link>
            <Link href={staticPageRoute('about')}>{text.footer.about}</Link>
            <Link href={staticPageRoute('shipping-policy')}>{text.footer.shipping}</Link>
            <Link href={staticPageRoute('contact')}>{text.footer.contact}</Link>
          </nav>
        </MobileNavMenu>
      </div>
    </header>
  );
}
