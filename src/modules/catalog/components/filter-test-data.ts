import messages from '@/i18n/messages/ar.json';

import type { CatalogParams } from '../url/catalog-params';
import { emptyCatalogParams } from '../url/catalog-params';
import type { FilterOptions } from '../types';

const text = messages.devCatalogFilters.fixtures;

// Test-only data typed from the generated GET /categories, /authors and /publishers items.
export const testFilterOptions: FilterOptions = {
  categories: [
    {
      id: 1,
      slug: 'novels',
      name: text.fiction,
      imageUrl: null,
      children: [
        { id: 11, slug: 'mystery', name: text.mystery, imageUrl: null, children: [] },
        { id: 12, slug: 'fantasy', name: text.fantasy, imageUrl: null, children: [] },
      ],
    },
    { id: 2, slug: text.poetry, name: text.poetry, imageUrl: null, children: [] },
  ],
  authors: [
    { id: 1, slug: 'sami-alhakim', name: text.authorOne },
    { id: 2, slug: 'omar-alsharif', name: text.authorTwo },
  ],
  publishers: [{ id: 1, slug: 'dar-al-asma', name: text.publisherOne, logoUrl: null }],
};

export const testText = text;

export const makeParams = (patch: Partial<CatalogParams> = {}): CatalogParams => ({
  ...emptyCatalogParams,
  ...patch,
});
