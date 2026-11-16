import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';

import messages from '@/i18n/messages/ar.json';
import { routes, staticPageRoute } from '@/shared/config/routes';
import { FeatureGate, FeatureLink } from '@/shared/ui/soon';

import styles from './site-footer.module.css';

export type SiteFooterProps = {
  contactDetails?: ReactNode;
  socialLinks?: ReactNode;
};

const catalogLinks = [
  ['store', routes.books, undefined],
  ['authors', routes.authors, 'catalog-authors'],
  ['categories', routes.categories, 'catalog-categories-index'],
  ['publishPackages', routes.publish, 'publish-packages'],
] as const;

const helpLinks = [
  ['about', staticPageRoute('about')],
  ['contact', staticPageRoute('contact')],
  ['privacy', staticPageRoute('privacy-policy')],
  ['terms', staticPageRoute('terms')],
  ['shipping', staticPageRoute('shipping-policy')],
  ['returns', staticPageRoute('return-policy')],
  ['payment', staticPageRoute('payment-methods')],
  ['faq', staticPageRoute('faq')],
] as const;

export function SiteFooter(props: SiteFooterProps) {
  void props;
  const text = messages.site;
  const newsletter = messages.home.campaigns;
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.wrap}>
        <div className={styles.grid}>
          <section className={styles.brand}>
            <Link aria-label={text.brand} className={styles.logo} href={routes.home}>
              <Image alt={text.brand} height={52} src="/logo-alasma.svg" unoptimized width={64} />
            </Link>
            <p>{text.footer.description}</p>
          </section>
          <section>
            <h2>{text.footer.explore}</h2>
            <nav aria-label={text.footer.explore} className={styles.links}>
              {catalogLinks.map(([key, href, feature]) =>
                feature ? (
                  <FeatureLink feature={feature} href={href} key={key} label={text.soon}>
                    {text.header[key]}
                  </FeatureLink>
                ) : (
                  <Link href={href} key={key}>
                    {text.header[key]}
                  </Link>
                ),
              )}
            </nav>
          </section>
          <section>
            <h2>{text.footer.help}</h2>
            <nav aria-label={text.footer.help} className={styles.links}>
              {helpLinks.map(([key, href]) => (
                <FeatureLink feature="static-pages" href={href} key={key} label={text.soon}>
                  {text.footer[key]}
                </FeatureLink>
              ))}
            </nav>
          </section>
          <section>
            <h2>{newsletter.newsletterTitle}</h2>
            <p className={styles.newsletterText}>{newsletter.newsletterDescription}</p>
            {/* The newsletter has no backend yet: dimmed and inert through the "soon" rule, no request. */}
            <FeatureGate feature="home-newsletter" label={text.soon}>
              <div className={styles.newsletter}>
                <span className={styles.newsletterField}>{newsletter.newsletterPlaceholder}</span>
                <span className={styles.newsletterButton}>{newsletter.newsletterSubmit}</span>
              </div>
            </FeatureGate>
          </section>
        </div>
        <div className={styles.bottom}>
          <span>{text.footer.copyright}</span>
          <span>{year}</span>
        </div>
      </div>
    </footer>
  );
}
