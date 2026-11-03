import { afterEach, describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import type { BookDetails } from '@/modules/catalog';

import {
  buildBookBreadcrumbJsonLd,
  buildBookJsonLd,
  buildBookMetadata,
  MAX_BOOK_SEO_DESCRIPTION_LENGTH,
  trimBookDescription,
} from './book-seo';

const baseBook: BookDetails = {
  id: 42,
  title: 'ظلال الحكاية',
  slug: 'shadows-of-the-tale',
  description: 'وصف الكتاب الكامل بالتفصيل.',
  price: 150,
  finalPrice: 120,
  discountPercent: 20,
  pageCount: 320,
  publishYear: 2025,
  coverType: 'Hardcover',
  language: 'Arabic',
  isbn: '978-1-23456-789-0',
  coverImageUrl: 'https://res.cloudinary.com/demo/image/upload/cover.jpg',
  images: [],
  authors: [
    {
      name: 'سامي الحكيم',
      role: 'Author',
      pageSlug: 'sami-al-hakim',
      shortBio: 'روائي مصري.',
      displayOrder: 1,
    },
  ],
  publisher: {
    name: 'دار الأسمى',
    slug: 'al-asma',
    shortDescription: null,
  },
  categories: [
    {
      id: 1,
      name: 'الروايات',
      slug: 'novels',
      isPrimary: true,
    },
  ],
  stockStatus: 'InStock',
  isNew: false,
  isFeatured: true,
};

describe('book-seo builders', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('builds full book JSON-LD and BreadcrumbList without aggregateRating or review', () => {
    vi.stubEnv('SITE_URL', 'https://alasma.com');

    const jsonLd = buildBookJsonLd(baseBook);
    expect(jsonLd).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Book',
      name: 'ظلال الحكاية',
      description: 'وصف الكتاب الكامل بالتفصيل.',
      url: 'https://alasma.com/books/shadows-of-the-tale',
      inLanguage: 'ar',
      isbn: '978-1-23456-789-0',
      image: 'https://res.cloudinary.com/demo/image/upload/cover.jpg',
      author: [
        {
          '@type': 'Person',
          name: 'سامي الحكيم',
          url: 'https://alasma.com/authors/sami-al-hakim',
        },
      ],
      publisher: {
        '@type': 'Organization',
        name: 'دار الأسمى',
      },
      offers: {
        '@type': 'Offer',
        price: 120,
        priceCurrency: 'EGP',
        availability: 'https://schema.org/InStock',
        url: 'https://alasma.com/books/shadows-of-the-tale',
      },
    });
    expect(jsonLd).not.toHaveProperty('aggregateRating');
    expect(jsonLd).not.toHaveProperty('review');

    const breadcrumb = buildBookBreadcrumbJsonLd(baseBook);
    expect(breadcrumb).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: messages.site.header.home,
          item: 'https://alasma.com/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: messages.site.header.store,
          item: 'https://alasma.com/books',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'الروايات',
          item: 'https://alasma.com/categories/novels',
        },
        {
          '@type': 'ListItem',
          position: 4,
          name: 'ظلال الحكاية',
          item: 'https://alasma.com/books/shadows-of-the-tale',
        },
      ],
    });
  });

  it('omits author, publisher, isbn, image and category breadcrumb when absent', () => {
    vi.stubEnv('SITE_URL', 'https://alasma.com');

    const minimalBook: BookDetails = {
      ...baseBook,
      authors: [],
      publisher: null,
      isbn: null,
      coverImageUrl: null,
      categories: [],
      description: null,
    };

    const jsonLd = buildBookJsonLd(minimalBook);
    expect(jsonLd).not.toHaveProperty('author');
    expect(jsonLd).not.toHaveProperty('publisher');
    expect(jsonLd).not.toHaveProperty('isbn');
    expect(jsonLd).not.toHaveProperty('image');
    expect(jsonLd).not.toHaveProperty('description');

    const breadcrumb = buildBookBreadcrumbJsonLd(minimalBook);
    expect(breadcrumb.itemListElement).toEqual([
      {
        '@type': 'ListItem',
        position: 1,
        name: messages.site.header.home,
        item: 'https://alasma.com/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: messages.site.header.store,
        item: 'https://alasma.com/books',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'ظلال الحكاية',
        item: 'https://alasma.com/books/shadows-of-the-tale',
      },
    ]);
  });

  it('uses finalPrice (never computed) for discounted books and maps LowStock and OutOfStock availability', () => {
    const lowStockDiscounted: BookDetails = {
      ...baseBook,
      price: 200,
      finalPrice: 149.5,
      discountPercent: 25,
      stockStatus: 'LowStock',
    };
    expect(buildBookJsonLd(lowStockDiscounted).offers).toMatchObject({
      price: 149.5,
      priceCurrency: 'EGP',
      availability: 'https://schema.org/LimitedAvailability',
    });

    const outOfStock: BookDetails = {
      ...baseBook,
      stockStatus: 'OutOfStock',
    };
    expect(buildBookJsonLd(outOfStock).offers).toMatchObject({
      availability: 'https://schema.org/OutOfStock',
    });
  });

  it('trims long descriptions at a word boundary to ~155 chars and uses fallback when empty', () => {
    const longDescription =
      'دراسة نقدية أدبية تبحر في أعماق السرد القصصي والروائي العربي متتبعة تحولات البنية الزمنية والمكانية وتأثير التراث الشفهي على التقنيات المعاصرة في الرواية العربية الحديثة عبر العقود الماضية.';
    const trimmed = trimBookDescription(longDescription);

    expect(trimmed.length).toBeLessThanOrEqual(MAX_BOOK_SEO_DESCRIPTION_LENGTH);
    expect(trimmed.endsWith('…')).toBe(true);
    expect(trimmed).toContain('دراسة نقدية أدبية');
    // Must end on a complete word before the ellipsis ("المعاصرة" rather than mid-word).
    expect(trimmed).toBe(
      'دراسة نقدية أدبية تبحر في أعماق السرد القصصي والروائي العربي متتبعة تحولات البنية الزمنية والمكانية وتأثير التراث الشفهي على التقنيات المعاصرة في الرواية…',
    );

    expect(trimBookDescription(null)).toBe(messages.seo.bookFallbackDescription);
    expect(trimBookDescription('   ')).toBe(messages.seo.bookFallbackDescription);
  });

  it('handles Arabic and special characters in title and slug and excludes non-https cover images', () => {
    vi.stubEnv('SITE_URL', 'https://alasma.com');

    const arabicSlugBook: BookDetails = {
      ...baseBook,
      title: 'ظلال & أنوار: قراءة في <التراث>',
      slug: 'ظلال-الحكاية-1',
      coverImageUrl: 'http://insecure.example.com/cover.jpg',
      description: null,
    };

    const meta = buildBookMetadata(arabicSlugBook);
    expect(meta.title).toBe('ظلال & أنوار: قراءة في <التراث>');
    expect(meta.description).toBe(messages.seo.bookFallbackDescription);
    expect(meta.alternates?.canonical).toBe(
      `https://alasma.com/books/${encodeURIComponent('ظلال-الحكاية-1')}`,
    );
    expect(meta.openGraph?.images).toBeUndefined();
    expect(meta.robots).toEqual({ index: true, follow: true });

    const jsonLd = buildBookJsonLd(arabicSlugBook);
    expect(jsonLd.url).toBe(`https://alasma.com/books/${encodeURIComponent('ظلال-الحكاية-1')}`);
    expect(jsonLd.image).toBeUndefined();
  });
});
