import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import * as featureConfig from '@/shared/config/features';
import type { BookCardItem, CategoryNode } from '@/modules/catalog';
import { axe } from '@/test/axe';

import type { HomeData } from '../types';
import { HomeView } from './home-view';

const refresh = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));

vi.mock('@/modules/cart', () => ({
  AddToCartButton: ({ title }: { title: string }) => <button type="button" aria-label={title} />,
}));

const sampleCategories: readonly CategoryNode[] = [
  {
    id: 1,
    slug: 'novels',
    name: messages.devHome.categories.novels,
    imageUrl: null,
    bookCount: 0,
    children: [],
  },
  {
    id: 2,
    slug: 'poetry',
    name: messages.devHome.categories.poetry,
    imageUrl: null,
    bookCount: 0,
    children: [],
  },
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

const sampleEvent = {
  title: messages.devHome.eventFixture.title,
  slug: 'event-1',
  imageUrl: null,
  location: messages.devHome.eventFixture.location,
  startsAt: '2026-12-05T16:00:00Z',
  endsAt: null,
  summary: messages.devHome.eventFixture.summary,
};

function buildTestHomeData(state: 'ok' | 'partial' | 'empty' | 'error'): HomeData {
  switch (state) {
    case 'empty':
      return {
        categories: { items: [], status: 'empty' },
        featured: { items: [], status: 'empty' },
        newArrivals: { items: [], status: 'empty' },
        events: { items: [], status: 'empty' },
      };
    case 'error':
      return {
        categories: { items: [], status: 'error' },
        featured: { items: [], status: 'error' },
        newArrivals: { items: [], status: 'error' },
        events: { items: [], status: 'error' },
      };
    case 'partial':
      return {
        categories: { items: sampleCategories, status: 'ok' },
        featured: { items: [], status: 'error' },
        newArrivals: { items: sampleBooks, status: 'ok' },
        events: { items: [], status: 'empty' },
      };
    default:
      return {
        categories: { items: sampleCategories, status: 'ok' },
        featured: { items: sampleBooks, status: 'ok' },
        newArrivals: { items: sampleBooks, status: 'ok' },
        events: { items: [sampleEvent], status: 'ok' },
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

    expect(screen.getByRole('link', { name: messages.devHome.categories.novels })).toHaveAttribute(
      'href',
      '/categories/novels',
    );

    const storeLinks = screen.getAllByRole('link', { name: messages.home.newArrivals.viewAll });
    expect(storeLinks.length).toBeGreaterThanOrEqual(2);
    for (const link of storeLinks) {
      expect(link).toHaveAttribute('href', '/books');
    }

    expect(await axe(container)).toHaveNoViolations();
  });

  it('hides every unfinished section instead of showing it dimmed, and leaves no empty wrapper (Task 76)', () => {
    const { container } = render(<HomeView data={buildTestHomeData('ok')} />);

    // the only dimmed piece is the event card's register action (no API for it yet)
    const dimmed = Array.from(container.querySelectorAll('[data-feature]'));
    expect(dimmed.map((node) => node.getAttribute('data-feature'))).toEqual(['event-register']);
    for (const label of [
      messages.home.spotlight.heading,
      messages.home.trending.heading,
      messages.home.teamPicks.heading,
      messages.home.showcase.bookOfMonthTitle,
      messages.home.showcase.eventTitle,
      messages.home.manifesto.publishCta,
    ]) {
      expect(screen.queryByText(label)).toBeNull();
    }
    // no section is left without content (an empty wrapper is the blank band)
    for (const section of Array.from(container.querySelectorAll('section'))) {
      expect(section.textContent?.trim().length ?? 0).toBeGreaterThan(0);
    }
    // the live parts stay
    expect(
      screen.getByRole('link', { name: new RegExp(messages.home.showcase.newReleasesTitle) }),
    ).toBeInTheDocument();
  });

  it('shows the nearest upcoming event from the API, without a date line, and a dimmed register action (Task 93)', () => {
    render(<HomeView data={buildTestHomeData('ok')} />);

    expect(
      screen.getByRole('heading', { name: messages.devHome.eventFixture.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(messages.devHome.eventFixture.summary)).toBeInTheDocument();
    // the design has no date or location line on this card
    expect(screen.queryByText(messages.devHome.eventFixture.location)).toBeNull();
    expect(document.querySelector('[data-feature="event-register"]')).toHaveAttribute('inert');
  });

  it('leaves the event card out when there is no upcoming event or the call failed (Task 93)', () => {
    for (const state of ['empty', 'error'] as const) {
      const { unmount } = render(<HomeView data={buildTestHomeData(state)} />);
      expect(
        screen.queryByRole('heading', { name: messages.devHome.eventFixture.title }),
      ).toBeNull();
      expect(document.querySelector('[data-feature="event-register"]')).toBeNull();
      unmount();
    }
  });

  it('brings a hidden section back once its feature is live', () => {
    const stateSpy = vi
      .spyOn(featureConfig, 'getFeatureState')
      .mockImplementation((key) => (key === 'home-editor-pick' ? 'live' : 'soon'));
    render(<HomeView data={buildTestHomeData('ok')} />);
    expect(
      screen.getByRole('heading', { name: messages.home.spotlight.heading }),
    ).toBeInTheDocument();
    expect(screen.queryByText(messages.home.trending.heading)).toBeNull();
    stateSpy.mockRestore();
  });

  it('renders the empty state for empty sections and an error state with retry for failed ones, and passes axe', async () => {
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

    // Task 67: a failed section is an error state with a retry, never the "nothing here yet" empty state
    const errorData = buildTestHomeData('error');
    rerender(<HomeView data={errorData} />);
    expect(
      screen.getByRole('heading', { level: 3, name: messages.home.categories.errorTitle }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('heading', { level: 3, name: messages.home.booksErrorTitle }),
    ).toHaveLength(2);
    for (const emptyTitle of [
      messages.home.categories.emptyTitle,
      messages.home.newArrivals.emptyTitle,
      messages.home.featured.emptyTitle,
    ]) {
      expect(screen.queryByRole('heading', { level: 3, name: emptyTitle })).toBeNull();
    }
    expect(screen.getAllByRole('button', { name: messages.site.loadError.retry })).toHaveLength(3);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders the partial state (one section failing, two ok) and passes axe', async () => {
    const partialData = buildTestHomeData('partial');
    const { container } = render(<HomeView data={partialData} />);

    expect(screen.getByText(messages.devHome.categories.novels)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: messages.home.booksErrorTitle }),
    ).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
