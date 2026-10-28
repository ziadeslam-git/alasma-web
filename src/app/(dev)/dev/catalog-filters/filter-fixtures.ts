import messages from '@/i18n/messages/ar.json';
import type { AuthorOption, CategoryNode, FilterOptions, PublisherOption } from '@/modules/catalog';

const text = messages.devCatalogFilters.fixtures;

// Dev-only fixtures typed from the generated GET /categories, /authors and /publishers items. Never used by real pages.
const category = (
  id: number,
  slug: string,
  name: string,
  children: CategoryNode[] = [],
): CategoryNode => ({
  id,
  slug,
  name,
  imageUrl: null,
  children,
});

export const fixtureCategories: readonly CategoryNode[] = [
  category(1, 'novels', text.fiction, [
    category(11, 'mystery', text.mystery),
    category(12, 'fantasy', text.fantasy),
  ]),
  // The slug is Arabic on purpose: it must round-trip through the URL.
  category(2, text.poetry, text.poetry),
];

const author = (id: number, slug: string, name: string): AuthorOption => ({
  id,
  slug,
  name,
});

export const fixtureAuthors: readonly AuthorOption[] = [
  author(1, 'sami-alhakim', text.authorOne),
  author(2, 'omar-alsharif', text.authorTwo),
  author(3, 'laila-almansouri', text.authorThree),
];

const publisher = (id: number, slug: string, name: string): PublisherOption => ({
  id,
  slug,
  name,
  logoUrl: null,
});

export const fixturePublishers: readonly PublisherOption[] = [
  publisher(1, 'dar-al-asma', text.publisherOne),
  publisher(2, 'others', text.publisherTwo),
];

export const filterFixtures: FilterOptions = {
  categories: fixtureCategories,
  authors: fixtureAuthors,
  publishers: fixturePublishers,
};

export const arabicCategorySlug = text.poetry;
