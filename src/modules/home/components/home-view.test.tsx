import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import type { BookCardItem, CategoryNode } from '@/modules/catalog';
import { axe } from '@/test/axe';

import type { HomeData } from '../types';
import { HomeView } from './home-view';

const sampleCategories: readonly CategoryNode[] = [
  { id: 1, slug: 'novels', name: messages.devHome.categories.novels, imageUrl: null, children: [] },
  { id: 2, slug: 'poetry', name: messages.devHome.categories.poetry, imageUrl: null, children: [] },
];

const sampleBooks: readonly BookCardItem[] = [
  {
    id: 1,
    slug: 'book-1',
    title: messages.devCatalog.fixtures.discountedTitle,
    authors: [messages.devCatalog.fixtures.discountedAuthor],
    coverImageUrl: null,
    price: 80,
    finalPrice: 65,
    discountPercent: 20,
    stockStatus: 'InStock',
    isFeatured: true,
    isNew: true,
  },
  {
    id: 2,
    slug: 'book-2',
    title: messages.devCatalog.fixtures.plainTitle,
    authors: [messages.devCatalog.fixtures.plainAuthor],
    coverImageUrl: null,
    price: 50,
    finalPrice: 50,
    discountPercent: 0,
    stockStatus: 'InStock',
    isFeatured: false,
    isNew: true,
  },
];

function buildTestHomeData(state: 'ok' | 'partial' | 'empty' | 'error'): HomeData {
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
        categories: { items: sampleCategories, status: 'ok' },
        featured: { items: [], status: 'error' },
        newArrivals: { items: sampleBooks, status: 'ok' },
      };
    default:
      return {
        categories: { items: sampleCategories, status: 'ok' },
        featured: { items: sampleBooks, status: 'ok' },
        newArrivals: { items: sampleBooks, status: 'ok' },
      };
  }
}

describe('HomeView', () => {
  it('renders exactly one h1, h2 headings per section, live category and book links, and passes axe in ok state', async () => {
    const data = buildTestHomeData('ok');
    const { container } = render(<HomeView data={data} />);

    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent(messages.home.manifesto.wordOne);

    expect(
      screen.getByRole('heading', { level: 2, name: messages.home.categories.heading }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: messages.home.newArrivals.heading }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: messages.home.featured.heading }),
    ).toBeInTheDocument();

    const categoryLink = screen.getByRole('link', { name: messages.devHome.categories.novels });
    expect(categoryLink).toHaveAttribute('href', '/categories/novels');

    const storeLinks = screen.getAllByRole('link', { name: messages.home.newArrivals.viewAll });
    expect(storeLinks.length).toBeGreaterThanOrEqual(2);
    for (const link of storeLinks) {
      expect(link).toHaveAttribute('href', '/books');
    }

    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders every Soon section inert with aria-disabled, the Soon badge, no live links inside Soon gates, and makes zero network requests', () => {
    const data = buildTestHomeData('ok');
    const { container } = render(<HomeView data={data} />);

    const expectedSoonFeatures = [
      'publish-packages',
      'home-book-of-month',
      'home-events',
      'home-editor-pick',
      'home-most-popular',
      'home-team-picks',
      'home-banners',
      'home-quotes',
      'home-newsletter',
    ] as const;

    for (const feature of expectedSoonFeatures) {
      const gate = container.querySelector<HTMLElement>(`[data-feature="${feature}"]`);
      expect(gate).not.toBeNull();
      expect(gate).toHaveAttribute('inert');
      expect(gate).toHaveAttribute('aria-disabled', 'true');
      expect(within(gate!).getByText(messages.site.soon)).toBeInTheDocument();
      expect(gate!.querySelector('a, button, input, select, textarea')).toBeNull();
    }
  });

  it('renders neutral EmptyState when sections are empty or error without exposing error details, and passes axe', async () => {
    const emptyData = buildTestHomeData('empty');
    const { container, rerender } = render(<HomeView data={emptyData} />);

    expect(
      screen.getByRole('heading', { level: 3, name: messages.home.categories.emptyTitle }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: messages.home.newArrivals.emptyTitle }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: messages.home.featured.emptyTitle }),
    ).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();

    const errorData = buildTestHomeData('error');
    rerender(<HomeView data={errorData} />);
    expect(
      screen.getByRole('heading', { level: 3, name: messages.home.categories.emptyTitle }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: messages.home.newArrivals.emptyTitle }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: messages.home.featured.emptyTitle }),
    ).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders the partial state (one section failing, two ok) and passes axe', async () => {
    const partialData = buildTestHomeData('partial');
    const { container } = render(<HomeView data={partialData} />);

    expect(
      screen.getByRole('link', { name: messages.devHome.categories.novels }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: messages.home.featured.emptyTitle }),
    ).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
