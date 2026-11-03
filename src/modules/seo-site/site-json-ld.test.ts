import { afterEach, describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';

import { buildOrganizationJsonLd, buildWebSiteJsonLd } from './site-json-ld';

describe('site JSON-LD builders', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('builds Organization JSON-LD with name, url and absolute logo URL', () => {
    vi.stubEnv('SITE_URL', 'https://alasma.com/');

    expect(buildOrganizationJsonLd()).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: messages.seo.siteName,
      url: 'https://alasma.com/',
      logo: 'https://alasma.com/logo-alasma.svg',
    });
  });

  it('builds WebSite JSON-LD with a SearchAction targeting /books?q={search_term_string}', () => {
    vi.stubEnv('SITE_URL', 'https://alasma.com/');

    expect(buildWebSiteJsonLd()).toEqual({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: messages.seo.siteName,
      url: 'https://alasma.com/',
      inLanguage: 'ar',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://alasma.com/books?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    });
  });
});
