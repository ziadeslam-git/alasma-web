import messages from '@/i18n/messages/ar.json';
import type { BookCardItem, BookDetails } from '@/modules/catalog';

import { catalogFixtures } from '../catalog/catalog-fixtures';

export type DevBookState =
  | 'in-stock'
  | 'discounted'
  | 'low-stock'
  | 'out-of-stock'
  | 'with-translator'
  | 'long-title'
  | 'no-cover'
  | 'no-description'
  | 'no-related';

export const DEV_BOOK_STATES: readonly DevBookState[] = [
  'in-stock',
  'discounted',
  'low-stock',
  'out-of-stock',
  'with-translator',
  'long-title',
  'no-cover',
  'no-description',
  'no-related',
] as const;

export function parseDevBookState(raw: string | string[] | undefined): DevBookState {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value && (DEV_BOOK_STATES as readonly string[]).includes(value)) {
    return value as DevBookState;
  }
  return 'in-stock';
}

const fixturesText = messages.devBook.fixtures;

const baseRelatedBooks: readonly BookCardItem[] = catalogFixtures.slice(0, 4);

const baseBook: BookDetails = {
  id: 101,
  slug: 'shadows-of-the-tale',
  title: fixturesText.bookTitle,
  description: fixturesText.bookDescription,
  price: 150,
  finalPrice: 150,
  discountPercent: 0,
  stockStatus: 'InStock',
  coverImageUrl: null,
  isFeatured: false,
  isNew: false,
  images: [],
  authors: [
    {
      name: fixturesText.authorName,
      role: 'Author',
      pageSlug: 'sami-el-hakim',
      shortBio: fixturesText.authorBio,
      displayOrder: 1,
    },
  ],
  categories: [
    {
      id: 1,
      name: fixturesText.categoryLiteraryStudies,
      slug: 'literary-studies',
      isPrimary: true,
    },
    {
      id: 2,
      name: fixturesText.categoryLiteraryCriticism,
      slug: 'literary-criticism',
      isPrimary: false,
    },
  ],
  publisher: {
    name: fixturesText.publisherName,
    slug: 'al-asma-publishing',
    shortDescription: null,
  },
  isbn: '978-977-123-456-7',
  pageCount: 384,
  publishYear: 2024,
  language: 'Arabic',
  coverType: 'Paperback',
};

export function buildDevBookData(state: DevBookState): {
  book: BookDetails;
  relatedBooks: readonly BookCardItem[];
} {
  switch (state) {
    case 'in-stock':
      return { book: { ...baseBook }, relatedBooks: baseRelatedBooks };

    case 'discounted':
      return {
        book: {
          ...baseBook,
          price: 180,
          finalPrice: 135,
          discountPercent: 25,
        },
        relatedBooks: baseRelatedBooks,
      };

    case 'low-stock':
      return {
        book: {
          ...baseBook,
          stockStatus: 'LowStock',
        },
        relatedBooks: baseRelatedBooks,
      };

    case 'out-of-stock':
      return {
        book: {
          ...baseBook,
          stockStatus: 'OutOfStock',
        },
        relatedBooks: baseRelatedBooks,
      };

    case 'with-translator':
      return {
        book: {
          ...baseBook,
          title: fixturesText.translatorTitle,
          authors: [
            {
              name: fixturesText.originalAuthor,
              role: 'Author',
              pageSlug: null,
              shortBio: null,
              displayOrder: 1,
            },
            {
              name: fixturesText.translatorName,
              role: 'Translator',
              pageSlug: null,
              shortBio: null,
              displayOrder: 2,
            },
          ],
        },
        relatedBooks: baseRelatedBooks,
      };

    case 'long-title':
      return {
        book: {
          ...baseBook,
          title: fixturesText.longTitle,
        },
        relatedBooks: baseRelatedBooks,
      };

    case 'no-cover':
      return {
        book: {
          ...baseBook,
          coverImageUrl: null,
        },
        relatedBooks: baseRelatedBooks,
      };

    case 'no-description':
      return {
        book: {
          ...baseBook,
          description: null,
        },
        relatedBooks: baseRelatedBooks,
      };

    case 'no-related':
      return {
        book: {
          ...baseBook,
        },
        relatedBooks: [],
      };
  }
}
