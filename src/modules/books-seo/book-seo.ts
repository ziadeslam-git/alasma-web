import type { Metadata } from 'next';

import messages from '@/i18n/messages/ar.json';
import type { BookDetails, BookStockStatus } from '@/modules/catalog';
import { authorRoute, bookRoute, categoryRoute, routes } from '@/shared/config/routes';
import { absoluteUrl } from '@/shared/config/site';
import { buildPageMetadata, isHttpsImageUrl, type JsonLdNode } from '@/shared/seo';

export const MAX_BOOK_SEO_DESCRIPTION_LENGTH = 155;

/**
 * Normalises whitespace in a plain-text description and trims it to at most `maxLength`
 * characters at a word boundary, appending an ellipsis when truncated.
 * Falls back to `fallback` when the input is null, undefined or blank.
 */
export function trimBookDescription(
  description: string | null | undefined,
  fallback: string = messages.seo.bookFallbackDescription,
  maxLength: number = MAX_BOOK_SEO_DESCRIPTION_LENGTH,
): string {
  const normalized = description?.replace(/\s+/g, ' ').trim() ?? '';
  if (!normalized) {
    return fallback;
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const sliceLimit = Math.max(1, maxLength - 1);
  const candidate = normalized.slice(0, sliceLimit + 1);
  const lastSpaceIndex = candidate.lastIndexOf(' ');
  const cut =
    lastSpaceIndex >= Math.floor(sliceLimit * 0.5)
      ? candidate.slice(0, lastSpaceIndex)
      : normalized.slice(0, sliceLimit);

  return `${cut.replace(/[\s،,.؛:!؟\-–—]+$/u, '')}…`;
}

export function mapStockStatusToAvailability(stockStatus: BookStockStatus): string {
  switch (stockStatus) {
    case 'InStock':
      return 'https://schema.org/InStock';
    case 'LowStock':
      return 'https://schema.org/LimitedAvailability';
    case 'OutOfStock':
      return 'https://schema.org/OutOfStock';
  }
}

export function buildBookMetadata(book: BookDetails): Metadata {
  const description = trimBookDescription(book.description);

  return buildPageMetadata({
    title: book.title,
    description,
    path: bookRoute(book.slug),
    image: book.coverImageUrl,
    noindex: false,
  });
}

export function buildBookJsonLd(book: BookDetails): JsonLdNode {
  const canonicalUrl = absoluteUrl(bookRoute(book.slug));
  const normalizedDescription = book.description?.replace(/\s+/g, ' ').trim();
  const isbn = book.isbn?.trim();

  const authors = book.authors.map((author) => ({
    '@type': 'Person',
    name: author.name,
    ...(author.pageSlug ? { url: absoluteUrl(authorRoute(author.pageSlug)) } : {}),
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: book.title,
    ...(normalizedDescription ? { description: normalizedDescription } : {}),
    url: canonicalUrl,
    inLanguage: 'ar',
    ...(isbn ? { isbn } : {}),
    ...(isHttpsImageUrl(book.coverImageUrl) ? { image: book.coverImageUrl } : {}),
    ...(authors.length > 0 ? { author: authors } : {}),
    ...(book.publisher?.name
      ? {
          publisher: {
            '@type': 'Organization',
            name: book.publisher.name,
          },
        }
      : {}),
    offers: {
      '@type': 'Offer',
      price: book.finalPrice,
      priceCurrency: 'EGP',
      availability: mapStockStatusToAvailability(book.stockStatus),
      url: canonicalUrl,
    },
  };
}

export function buildBookBreadcrumbJsonLd(book: BookDetails): JsonLdNode {
  const primaryCategory =
    book.categories.find((category) => category.isPrimary) ?? book.categories[0];

  const items: Array<{ name: string; item: string }> = [
    {
      name: messages.site.header.home,
      item: absoluteUrl(routes.home),
    },
    {
      name: messages.site.header.store,
      item: absoluteUrl(routes.books),
    },
  ];

  if (primaryCategory) {
    items.push({
      name: primaryCategory.name,
      item: absoluteUrl(categoryRoute(primaryCategory.slug)),
    });
  }

  items.push({
    name: book.title,
    item: absoluteUrl(bookRoute(book.slug)),
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((entry, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: entry.name,
      item: entry.item,
    })),
  };
}
