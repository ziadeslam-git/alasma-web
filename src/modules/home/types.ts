import type { BookCardItem, CategoryNode } from '@/modules/catalog';

export type HomeSectionStatus = 'ok' | 'empty' | 'error';

export type HomeSectionResult<T> = {
  items: readonly T[];
  status: HomeSectionStatus;
};

export type HomeData = {
  categories: HomeSectionResult<CategoryNode>;
  featured: HomeSectionResult<BookCardItem>;
  newArrivals: HomeSectionResult<BookCardItem>;
};
