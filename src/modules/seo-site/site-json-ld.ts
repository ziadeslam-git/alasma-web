import messages from '@/i18n/messages/ar.json';
import { routes } from '@/shared/config/routes';
import { absoluteUrl, getSiteUrl } from '@/shared/config/site';
import type { JsonLdNode } from '@/shared/seo';

export function buildOrganizationJsonLd(): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: messages.seo.siteName,
    url: absoluteUrl(routes.home),
    logo: absoluteUrl('/logo-alasma.svg'),
  };
}

export function buildWebSiteJsonLd(): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: messages.seo.siteName,
    url: absoluteUrl(routes.home),
    inLanguage: 'ar',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${getSiteUrl()}/books?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}
