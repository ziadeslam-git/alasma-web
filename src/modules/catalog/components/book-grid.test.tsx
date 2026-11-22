import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { axe } from '@/test/axe';

import type { BookCardItem } from '../types';
import { BookGrid, DEFAULT_SKELETON_COUNT, FIRST_ROW_PRIORITY_COUNT } from './book-grid';

vi.mock('@/modules/wishlist', () => ({
  WishlistHeart: ({ title, className }: { title: string; className?: string }) => (
    <button
      aria-label={`wishlist ${title}`}
      aria-pressed="false"
      className={className}
      type="button"
    />
  ),
}));

vi.mock('@/modules/cart', () => ({
  AddToCartButton: ({ title }: { title: string }) => <button type="button" aria-label={title} />,
}));

const items: readonly BookCardItem[] = [
  {
    id: 1,
    slug: 'book-one',
    title: 'ليالي القاهرة',
    coverImageUrl: null,
    authors: ['عمر الشريف'],
    price: 130,
    finalPrice: 130,
    discountPercent: 0,
    stockStatus: 'InStock',
    isNew: false,
    isFeatured: false,
  },
  {
    id: 2,
    slug: 'book-two',
    title: 'ظلال الحكاية',
    coverImageUrl: null,
    authors: ['سامي الحكيم'],
    price: 150,
    finalPrice: 120,
    discountPercent: 20,
    stockStatus: 'LowStock',
    isNew: true,
    isFeatured: true,
  },
];

describe('BookGrid images', () => {
  it('loads the first row eagerly and the rest lazily', () => {
    const many = Array.from({ length: 6 }, (_, index) => ({
      ...items[0]!,
      id: 100 + index,
      slug: `book-${index}`,
      coverImageUrl: `/cover-${index}.jpg`,
    }));
    const { container } = render(<BookGrid items={many} />);
    const images = Array.from(container.querySelectorAll('img'));

    expect(images).toHaveLength(6);
    expect(
      images.slice(0, FIRST_ROW_PRIORITY_COUNT).map((img) => img.getAttribute('loading')),
    ).not.toContain('lazy');
    expect(
      images.slice(FIRST_ROW_PRIORITY_COUNT).map((img) => img.getAttribute('loading')),
    ).toEqual(['lazy', 'lazy']);
    // Each cover tells the browser the width it is shown at, so a right-sized file is chosen.
    expect(images[0]?.getAttribute('sizes')).toContain('240px');
  });
});

describe('BookGrid', () => {
  it('renders a BookCard for every item and passes axe', async () => {
    const { container } = render(<BookGrid items={items} />);

    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2);
    expect(screen.getByRole('link', { name: 'ليالي القاهرة' })).toHaveAttribute(
      'href',
      '/books/book-one',
    );
    expect(screen.getByRole('link', { name: 'ظلال الحكاية' })).toHaveAttribute(
      'href',
      '/books/book-two',
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders the loading skeleton cards with cover and body placeholders and passes axe', async () => {
    const { container } = render(<BookGrid isLoading items={[]} />);

    const grid = screen.getByRole('status', { name: messages.catalog.loadingLabel });
    expect(grid).toHaveAttribute('aria-busy', 'true');
    const cards = grid.children;
    expect(cards).toHaveLength(DEFAULT_SKELETON_COUNT);
    expect(cards[0]?.querySelectorAll('[aria-busy="true"]').length).toBeGreaterThanOrEqual(4);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('respects a custom skeletonCount when loading', () => {
    render(<BookGrid isLoading items={[]} skeletonCount={4} />);

    const grid = screen.getByRole('status', { name: messages.catalog.loadingLabel });
    expect(grid.children).toHaveLength(4);
  });

  it('renders the EmptyState when items is empty and isLoading is false', async () => {
    const { container } = render(<BookGrid items={[]} />);

    expect(
      screen.getByRole('heading', { level: 2, name: messages.catalog.emptyTitle }),
    ).toBeInTheDocument();
    expect(screen.getByText(messages.catalog.emptyDescription)).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
