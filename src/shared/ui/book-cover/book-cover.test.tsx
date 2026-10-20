import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { axe } from '@/test/axe';

import { BookCover, getBookCoverVariant } from './book-cover';

describe('BookCover', () => {
  it('uses the image path when a URL is provided and draws a cover otherwise', () => {
    const { container, rerender } = render(
      <BookCover imageUrl="/cover.jpg" title="Book title" variantKey="book-1" />,
    );

    expect(container.querySelector('img')).toBeInTheDocument();
    rerender(<BookCover title="Book title" variantKey="book-1" />);
    expect(screen.getByText('Book title')).toBeInTheDocument();
  });

  it('selects the same fallback variant for the same key', () => {
    expect(getBookCoverVariant('book-1')).toBe(getBookCoverVariant('book-1'));
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<BookCover title="Book title" variantKey="book-1" />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
