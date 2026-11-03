import { afterEach, describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';

import { buildPageMetadata, isHttpsImageUrl } from './metadata';

describe('buildPageMetadata', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('builds canonical, Open Graph ar_EG and summary Twitter card when no https image exists', () => {
    vi.stubEnv('SITE_URL', 'https://alasma.com');

    const meta = buildPageMetadata({
      title: 'المتجر',
      description: 'وصف المتجر',
      path: '/books',
    });

    expect(meta.title).toBe('المتجر');
    expect(meta.description).toBe('وصف المتجر');
    expect(meta.alternates?.canonical).toBe('https://alasma.com/books');
    expect(meta.openGraph).toEqual({
      title: 'المتجر',
      description: 'وصف المتجر',
      url: 'https://alasma.com/books',
      siteName: messages.seo.siteName,
      locale: 'ar_EG',
      type: 'website',
    });
    expect(meta.twitter).toEqual({
      card: 'summary',
      title: 'المتجر',
      description: 'وصف المتجر',
    });
    expect(meta.robots).toEqual({ index: true, follow: true });
  });

  it('includes Open Graph images and summary_large_image Twitter card only for absolute https images', () => {
    vi.stubEnv('SITE_URL', 'https://alasma.com');

    const withHttps = buildPageMetadata({
      title: 'كتاب',
      description: 'وصف',
      path: '/books/test',
      image: 'https://res.cloudinary.com/demo/image/upload/cover.jpg',
    });
    expect(withHttps.openGraph?.images).toEqual([
      { url: 'https://res.cloudinary.com/demo/image/upload/cover.jpg' },
    ]);
    expect(withHttps.twitter).toMatchObject({
      card: 'summary_large_image',
      images: ['https://res.cloudinary.com/demo/image/upload/cover.jpg'],
    });

    const withHttp = buildPageMetadata({
      title: 'كتاب',
      description: 'وصف',
      path: '/books/test',
      image: 'http://example.com/cover.jpg',
    });
    expect(withHttp.openGraph?.images).toBeUndefined();
    expect(withHttp.twitter).toMatchObject({ card: 'summary' });
    expect(isHttpsImageUrl('/relative.jpg')).toBe(false);
    expect(isHttpsImageUrl('http://example.com/a.jpg')).toBe(false);
    expect(isHttpsImageUrl('https://example.com/a.jpg')).toBe(true);
  });

  it('falls back to the default Arabic description and supports noindex,follow', () => {
    const meta = buildPageMetadata({
      title: 'المتجر',
      description: '   ',
      path: '/books',
      noindex: true,
    });

    expect(meta.description).toBe(messages.seo.defaultDescription);
    expect(meta.robots).toEqual({ index: false, follow: true });
  });
});
