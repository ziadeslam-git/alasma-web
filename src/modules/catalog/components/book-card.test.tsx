import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { axe } from '@/test/axe';

import type { BookCardItem } from '../types';
import { BookCard } from './book-card';

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

  it('renders the out-of-stock badge and notify-me Soon control when stockStatus is OutOfStock', async () => {
    const book = makeBook({ stockStatus: 'OutOfStock' });
    const { container } = render(<BookCard book={book} />);

    expect(screen.getByText(text.stock.outOfStock, { selector: 'span' })).toBeInTheDocument();
    expect(container.querySelector('article')?.className).toContain('outOfStock');
    expect(container.querySelector('[data-feature="cart-page"]')).toBeNull();

    const notifyGate = container.querySelector('[data-feature="reservations-notify-me"]');
    expect(notifyGate).toHaveAttribute('inert');
    expect(notifyGate).toHaveTextContent(text.notifyMe);
    expect(notifyGate).toHaveTextContent(messages.site.soon);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('keeps the add-to-cart and wishlist controls inert with the Soon badge', () => {
    const book = makeBook();
    const { container } = render(<BookCard book={book} />);

    const cartGate = container.querySelector('[data-feature="cart-page"]');
    const wishlistGate = container.querySelector('[data-feature="wishlist-heart"]');

    expect(cartGate).toHaveAttribute('inert');
    expect(cartGate).toHaveTextContent(messages.site.soon);
    expect(cartGate?.querySelector('button')).toBeDisabled();

    expect(wishlistGate).toHaveAttribute('inert');
    expect(wishlistGate).toHaveTextContent(messages.site.soon);
    expect(wishlistGate?.querySelector('button')).toBeDisabled();
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
