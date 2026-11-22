import type { BookCardItem, CategoryNode } from '@/modules/catalog';
import type { components } from '@/shared/lib/api';

export type HomeEvent = components['schemas']['EventListItemDto'];

export type HomeSectionStatus = 'ok' | 'empty' | 'error';

export type HomeSectionResult<T> = {
  items: readonly T[];
  status: HomeSectionStatus;
};

export type HomeData = {
  categories: HomeSectionResult<CategoryNode>;
  /** The nearest upcoming event (at most one item). */
  events: HomeSectionResult<HomeEvent>;
  featured: HomeSectionResult<BookCardItem>;
  /** The best sellers of the last 90 days, best first (the home band shows five). */
  bestSellers: HomeSectionResult<BookCardItem>;
  newArrivals: HomeSectionResult<BookCardItem>;
};
