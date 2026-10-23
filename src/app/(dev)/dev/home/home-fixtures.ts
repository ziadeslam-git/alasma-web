import messages from '@/i18n/messages/ar.json';
import type { CategoryNode } from '@/modules/catalog';
import type { HomeData } from '@/modules/home';

import { catalogFixtures } from '../catalog/catalog-fixtures';

const categoryNames = messages.devHome.categories;

// Dev-only fixtures for /dev/home. Never imported by production routes.
export const homeCategoryFixtures: readonly CategoryNode[] = [
  { id: 1, slug: 'novels', name: categoryNames.novels, imageUrl: null, children: [] },
  { id: 2, slug: 'poetry', name: categoryNames.poetry, imageUrl: null, children: [] },
  { id: 3, slug: 'self-help', name: categoryNames.selfHelp, imageUrl: null, children: [] },
  { id: 4, slug: 'history', name: categoryNames.history, imageUrl: null, children: [] },
  { id: 5, slug: 'philosophy', name: categoryNames.philosophy, imageUrl: null, children: [] },
  { id: 6, slug: 'children', name: categoryNames.children, imageUrl: null, children: [] },
];

export const homeFeaturedFixtures = catalogFixtures.slice(0, 5);
export const homeNewArrivalsFixtures = catalogFixtures.slice(3, 8);

export type DevHomeState = 'ok' | 'partial' | 'empty' | 'error';

export function buildDevHomeData(state: DevHomeState): HomeData {
  switch (state) {
    case 'empty':
      return {
        categories: { items: [], status: 'empty' },
        featured: { items: [], status: 'empty' },
        newArrivals: { items: [], status: 'empty' },
      };
    case 'error':
      return {
        categories: { items: [], status: 'error' },
        featured: { items: [], status: 'error' },
        newArrivals: { items: [], status: 'error' },
      };
    case 'partial':
      return {
        categories: { items: homeCategoryFixtures, status: 'ok' },
        featured: { items: [], status: 'error' },
        newArrivals: { items: homeNewArrivalsFixtures, status: 'ok' },
      };
    default:
      return {
        categories: { items: homeCategoryFixtures, status: 'ok' },
        featured: { items: homeFeaturedFixtures, status: 'ok' },
        newArrivals: { items: homeNewArrivalsFixtures, status: 'ok' },
      };
  }
}

export function parseDevHomeState(raw: string | string[] | undefined): DevHomeState {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === 'empty' || value === 'error' || value === 'partial') {
    return value;
  }
  return 'ok';
}
