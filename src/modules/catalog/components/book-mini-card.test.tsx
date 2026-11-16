import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { axe } from '@/test/axe';

import type { BookCardItem } from '../types';
import { BookMiniCard } from './book-mini-card';

const text = messages.catalog;

function makeBook(overrides: Partial<BookCardItem> = {}): BookCardItem {
  return {
    id: 1,
    slug: 'book-1',
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

describe('BookMiniCard', () => {
  it('links to the book and shows only the title, author and the API price', async () => {
    const { container } = render(<BookMiniCard book={makeBook({ isNew: true })} />);

    expect(container.querySelector('a')).toHaveAttribute('href', '/books/book-1');
    expect(screen.getByRole('heading', { name: 'ظلال الحكاية' })).toBeInTheDocument();
    expect(screen.getByText('سامي الحكيم')).toBeInTheDocument();
    expect(screen.getByText(`130 ${text.currency}`)).toBeInTheDocument();
    expect(screen.getByText(text.newBadge)).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows the discount badge and the struck-through original price instead of the new badge', () => {
    const { container } = render(
      <BookMiniCard
        book={makeBook({ price: 150, finalPrice: 120, discountPercent: 20, isNew: true })}
      />,
    );

    expect(screen.getByText('خصم 20%')).toBeInTheDocument();
    expect(screen.queryByText(text.newBadge)).toBeNull();
    expect(container.querySelector('s')).toHaveTextContent('150');
  });

  it('omits the author line when the API gives no author', () => {
    const { container } = render(<BookMiniCard book={makeBook({ authors: [] })} />);

    expect(container.querySelector('small')).toBeNull();
  });
});
