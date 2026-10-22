import type { components } from '@/shared/lib/api';

export type BookCardItem = components['schemas']['BookCardDto'];
export type BookStockStatus = components['schemas']['BookStockStatus'];
export type PagedBookCards = components['schemas']['PagedResultOfBookCardDto'];

// Item types of GET /categories (a tree), GET /authors and GET /publishers, straight from the generated schema.
export type CategoryNode = components['schemas']['CategoryNodeDto'];
export type AuthorOption = components['schemas']['AuthorListItemDto'];
export type PublisherOption = components['schemas']['PublisherDto'];

// The option lists the filter controls receive as props (the page that owns the data fetches them).
export type FilterOptions = {
  categories: readonly CategoryNode[];
  authors: readonly AuthorOption[];
  publishers: readonly PublisherOption[];
};
