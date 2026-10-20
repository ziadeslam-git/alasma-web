import Link from 'next/link';
import type { ReactNode } from 'react';

import messages from '@/i18n/messages/ar.json';
import { routes, staticPageRoute } from '@/shared/config/routes';

import styles from './site-footer.module.css';

export type SiteFooterProps = {
  contactDetails?: ReactNode;
  socialLinks?: ReactNode;
};

const catalogLinks = [
  ['store', routes.books],
  ['authors', routes.authors],
  ['categories', routes.categories],
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
              {text.brand}
            </Link>
            <p>{text.footer.description}</p>
          </section>
          <section>
            <h2>{text.footer.explore}</h2>
            <nav aria-label={text.footer.explore} className={styles.links}>
              {catalogLinks.map(([key, href]) => (
                <Link href={href} key={key}>
                  {text.header[key]}
                </Link>
              ))}
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
