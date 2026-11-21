import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { FeatureFlagsProvider, resolveFeatureFlags } from '@/shared/config/feature-flags';
import { axe } from '@/test/axe';

import type { BookCardItem } from '../types';
import { BookCard } from './book-card';

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

const text = messages.catalog;

function makeBook(overrides: Partial<BookCardItem> = {}): BookCardItem {
  return {
    id: 1,
    slug: 'ظلال-الحكاية',
    title: 'ظلال الحكاية',
    coverImageUrl: null,
    authors: ['سامي الحكيم'],
    price: 130,
    finalPrice: 130,
    discountPercent: 0,
    stockStatus: 'InStock',
    isNew: false,
    isFeatured: false,
    ...overrides,
  };
}

describe('BookCard', () => {
  it('renders a plain in-stock book with encoded route href, clamped title, author and price', async () => {
    const book = makeBook({ isNew: true, isFeatured: true });
    const { container } = render(<BookCard book={book} />);

    const link = screen.getByRole('link', { name: book.title });
    expect(link).toHaveAttribute('href', `/books/${encodeURIComponent(book.slug)}`);
    expect(link.className).toContain('titleLink');
    expect(screen.getByText(`${text.authorPrefix}${book.authors[0]}`)).toBeInTheDocument();
    expect(screen.getByText(`130 ${text.currency}`)).toBeInTheDocument();
    expect(screen.getByText(text.newBadge, { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText(text.featuredBadge, { selector: 'span' })).toBeInTheDocument();
    expect(container.querySelector('s')).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders a discounted book with final price, struck-through original price and discount badge', async () => {
    const book = makeBook({
      price: 150,
      finalPrice: 120,
      discountPercent: 20,
      isNew: true,
    });
    const { container } = render(<BookCard book={book} />);

    expect(screen.getByText('خصم 20%', { selector: 'span' })).toBeInTheDocument();
    expect(screen.queryByText(text.newBadge, { selector: 'span' })).not.toBeInTheDocument();
    expect(screen.getByText(/120 ج\.م/)).toBeInTheDocument();
    const struck = container.querySelector('s');
    expect(struck).toHaveTextContent('150');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders the low-stock badge when stockStatus is LowStock', async () => {
    const book = makeBook({ stockStatus: 'LowStock' });
    const { container } = render(<BookCard book={book} />);

    expect(screen.getByText(text.stock.lowStock, { selector: 'span' })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders the out-of-stock badge and no notify-me control when stockStatus is OutOfStock', async () => {
    const book = makeBook({ stockStatus: 'OutOfStock' });
    const { container } = render(<BookCard book={book} />);

    expect(screen.getByText(text.stock.outOfStock, { selector: 'span' })).toBeInTheDocument();
    expect(container.querySelector('article')?.className).toContain('outOfStock');
    expect(container.querySelector('[data-feature="cart-page"]')).toBeNull();

    // Task 76: the notify-me action is hidden (not dimmed with a badge) until its feature is live
    expect(container.querySelector('[data-feature="reservations-notify-me"]')).toBeNull();
    expect(screen.queryByText(text.notifyMe)).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders add-to-cart and leaves the wishlist heart out while it is soon (Task 78)', () => {
    const book = makeBook();
    const { container } = render(<BookCard book={book} />);

    expect(screen.getByRole('button', { name: book.title })).toBeEnabled();
    expect(container.querySelector('[data-feature="wishlist-heart"]')).toBeNull();
    expect(
      screen.queryByRole('button', { name: text.addToWishlist.replace('{title}', book.title) }),
    ).toBeNull();
  });

  it('renders the wishlist heart once its feature is live', () => {
    const book = makeBook();
    render(
      <FeatureFlagsProvider value={{ ...resolveFeatureFlags(null), 'wishlist-heart': 'live' }}>
        <BookCard book={book} />
      </FeatureFlagsProvider>,
    );

    expect(screen.getByRole('button', { name: `wishlist ${book.title}` })).toBeInTheDocument();
  });

  it('leaves the wishlist heart out while the feature is soon', () => {
    const book = makeBook();
    render(
      <FeatureFlagsProvider value={{ ...resolveFeatureFlags(null), 'wishlist-heart': 'soon' }}>
        <BookCard book={book} />
      </FeatureFlagsProvider>,
    );

    expect(screen.queryByRole('button', { name: `wishlist ${book.title}` })).toBeNull();
  });

  it('shows the remove slot in place of the action-bar heart on the wishlist page', () => {
    const book = makeBook();
    render(
      <BookCard book={book} removeSlot={<button type="button">remove {book.title}</button>} />,
    );

    expect(screen.getByRole('button', { name: `remove ${book.title}` })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: `wishlist ${book.title}` })).toBeNull();
  });

  it('joins multiple authors with the Arabic comma separator', () => {
    const book = makeBook({ authors: ['خالد منصور', 'ليلى المنصوري', 'منى عبد الرحمن'] });
    render(<BookCard book={book} />);

    expect(
      screen.getByText(`${text.authorPrefix}خالد منصور، ليلى المنصوري، منى عبد الرحمن`),
    ).toBeInTheDocument();
  });

  it('contains exactly one article element when coverImageUrl is null and renders nothing for quick-view', () => {
    const book = makeBook({ coverImageUrl: null });
    const { container } = render(<BookCard book={book} />);

    expect(container.querySelectorAll('article')).toHaveLength(1);
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(container.querySelector('[data-feature="quick-view"]')).toBeNull();
  });
});
