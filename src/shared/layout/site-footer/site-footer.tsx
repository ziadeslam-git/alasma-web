import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';

import messages from '@/i18n/messages/ar.json';
import { routes, staticPageRoute } from '@/shared/config/routes';
import { FeatureGate } from '@/shared/ui/soon';

import styles from './site-footer.module.css';

export type SiteFooterProps = {
  contactDetails?: ReactNode;
  socialLinks?: ReactNode;
};

const catalogLinks = [
  ['store', routes.books],
  ['authors', routes.authors],
  ['categories', routes.categories],
  ['publishPackages', routes.publish],
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
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.wrap}>
        <div className={styles.grid}>
          <section className={styles.brand}>
            <Link aria-label={text.brand} className={styles.logo} href={routes.home}>
              <Image alt={text.brand} height={52} src="/logo-alasma.svg" unoptimized width={208} />
            </Link>
            <p>{text.footer.description}</p>
          </section>
          <section>
            <h2>{text.footer.explore}</h2>
            <nav aria-label={text.footer.explore} className={styles.links}>
              {catalogLinks.map(([key, href]) =>
                key === 'publishPackages' ? (
                  <FeatureGate feature="publish-packages" key={key} label={text.soon}>
                    <Link href={href}>{text.header[key]}</Link>
                  </FeatureGate>
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
                <Link href={href} key={key}>
                  {text.footer[key]}
                </Link>
              ))}
            </nav>
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
