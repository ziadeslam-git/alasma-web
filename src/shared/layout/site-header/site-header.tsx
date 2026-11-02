import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';

import messages from '@/i18n/messages/ar.json';
import type { FeatureKey } from '@/shared/config/features';
import { routes, staticPageRoute } from '@/shared/config/routes';
import { MobileNavMenu } from '@/shared/layout/mobile-nav';
import { ButtonLink } from '@/shared/ui/button';
import { Icon } from '@/shared/ui/icon';
import { FeatureGate, FeatureLink } from '@/shared/ui/soon';

import styles from './site-header.module.css';

export type SiteHeaderProps = {
  accountArea?: ReactNode;
  search?: ReactNode;
};

function DeferredLink({
  feature,
  href,
  label,
}: {
  feature: FeatureKey;
  href: string;
  label: string;
  inline?: boolean;
}) {
  return (
    <FeatureLink feature={feature} href={href} label={messages.site.soon}>
      {label}
    </FeatureLink>
  );
}

export function SiteHeader({ accountArea, search }: SiteHeaderProps) {
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
          <Image
            alt={text.brand}
            height={136}
            priority
            src="/logo-alasma.svg"
            unoptimized
            width={168}
          />
        </Link>
        {search ? (
          <div className={styles.search}>{search}</div>
        ) : (
          <form action={routes.books} className={styles.search} method="get" role="search">
            <Icon name="search" />
            <input
              aria-label={text.search.label}
              name="q"
              placeholder={text.search.placeholder}
              type="search"
            />
          </form>
        )}
        <nav aria-label={text.header.home} className={styles.links}>
          <Link href={routes.home}>{text.header.home}</Link>
          <Link href={routes.books}>{text.header.store}</Link>
          <FeatureGate badge="inline" feature="home-most-popular" label={text.soon}>
            <span>{text.header.bestSellers}</span>
          </FeatureGate>
          <FeatureGate badge="inline" feature="offers-bundles" label={text.soon}>
            <span>{text.header.offers}</span>
          </FeatureGate>
          <DeferredLink
            feature="catalog-authors"
            href={routes.authors}
            inline
            label={text.header.authors}
          />
          <FeatureGate badge="inline" feature="home-events" label={text.soon}>
            <span>{text.header.events}</span>
          </FeatureGate>
          <DeferredLink
            feature="publish-packages"
            href={routes.publish}
            inline
            label={text.header.publishPackages}
          />
          <DeferredLink
            feature="catalog-categories-index"
            href={routes.categories}
            inline
            label={text.header.categories}
          />
        </nav>
        <div className={styles.actions}>
          <FeatureLink feature="wishlist-heart" label={text.soon} href={routes.home}>
            <span aria-label={text.header.wishlist} className={styles.iconLink}>
              <Icon name="heart" />
            </span>
          </FeatureLink>
          <FeatureLink feature="cart-page" label={text.soon} href={routes.cart}>
            <span aria-label={text.header.cart} className={styles.iconLink}>
              <Icon name="bag" />
            </span>
          </FeatureLink>
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
            <DeferredLink
              feature="catalog-authors"
              href={routes.authors}
              inline
              label={text.header.authors}
            />
            <DeferredLink
              feature="catalog-categories-index"
              href={routes.categories}
              inline
              label={text.header.categories}
            />
            <DeferredLink
              feature="publish-packages"
              href={routes.publish}
              inline
              label={text.header.publishPackages}
            />
            <DeferredLink
              feature="static-pages"
              href={staticPageRoute('about')}
              inline
              label={text.footer.about}
            />
            <DeferredLink
              feature="static-pages"
              href={staticPageRoute('shipping-policy')}
              inline
              label={text.footer.shipping}
            />
            <DeferredLink
              feature="static-pages"
              href={staticPageRoute('contact')}
              inline
              label={text.footer.contact}
            />
          </nav>
        </MobileNavMenu>
      </div>
    </header>
  );
}
