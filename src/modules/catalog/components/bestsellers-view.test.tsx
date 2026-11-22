import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { FeatureFlagsProvider, resolveFeatureFlags } from '@/shared/config/feature-flags';
import { axe } from '@/test/axe';

import type { BookCardItem } from '../types';
import { BestsellersView } from './bestsellers-view';

vi.mock('@/modules/cart', () => ({
  AddToCartButton: ({ title }: { title: string }) => <button type="button" aria-label={title} />,
}));
vi.mock('@/modules/wishlist', () => ({
  WishlistHeart: ({ title }: { title: string }) => (
    <button aria-label={`wishlist ${title}`} aria-pressed="false" type="button" />
  ),
}));

const text = messages.bestsellers;
const book = (id: number): BookCardItem => ({
  id,
  slug: `book-${id}`,
  title: `Book ${id}`,
  coverImageUrl: null,
  authors: [`Author ${id}`],
  price: 100 + id,
  finalPrice: 100 + id,
  discountPercent: 0,
  stockStatus: 'InStock',
  isNew: false,
  isFeatured: false,
});
const six = [1, 2, 3, 4, 5, 6].map(book);

describe('BestsellersView', () => {
  it('shows the banner, the top three on a podium and the rest ranked from 4', async () => {
    const { container } = render(<BestsellersView result={{ status: 'ok', items: six }} />);

    expect(screen.getByRole('heading', { level: 1, name: text.heading })).toBeInTheDocument();
    expect(screen.getByText(text.intro)).toBeInTheDocument();
    const podium = screen.getByRole('list', { name: text.listLabel });
    expect(within(podium).getAllByRole('listitem')).toHaveLength(3);
    expect(within(podium).getByText(text.podiumPlace.replace('{rank}', '1'))).toBeInTheDocument();
    expect(within(podium).getByText('101 ج.م')).toBeInTheDocument();
    expect(within(podium).getAllByRole('link', { name: 'Book 1' })[0]).toHaveAttribute(
      'href',
      '/books/book-1',
    );
    for (const rank of ['4', '5', '6']) {
      expect(
        screen.getByRole('img', { name: text.rankLabel.replace('{rank}', rank) }),
      ).toBeInTheDocument();
    }
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows the period tabs dimmed and inert (the API has one 90-day ranking)', () => {
    render(<BestsellersView result={{ status: 'ok', items: six }} />);

    const tabs = document.querySelector('[data-feature="bestsellers-period"]');
    expect(tabs).toHaveAttribute('inert');
    expect(tabs).toHaveTextContent(text.tabWeek);
  });

  it('leaves the tabs out when the period feature is hidden', () => {
    render(
      <FeatureFlagsProvider
        value={{ ...resolveFeatureFlags(null), 'bestsellers-period': 'hidden' }}
      >
        <BestsellersView result={{ status: 'ok', items: six }} />
      </FeatureFlagsProvider>,
    );

    expect(screen.queryByText(text.tabMonth)).toBeNull();
  });

  it('shows the empty state when nothing sold and an error message when the call failed', () => {
    const { rerender } = render(<BestsellersView result={{ status: 'empty', items: [] }} />);
    expect(screen.getByText(text.emptyTitle)).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: text.listLabel })).toBeNull();

    rerender(<BestsellersView result={{ status: 'error', items: [] }} />);
    expect(screen.getByRole('alert')).toHaveTextContent(text.error);
  });
});
