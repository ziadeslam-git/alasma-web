import { fireEvent, render, screen } from '@testing-library/react';
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

  it('swaps a cover image that fails to load for the designed cover with the title', () => {
    const { container } = render(
      <BookCover imageUrl="/cover.jpg" title="Book title" variantKey="book-1" />,
    );

    fireEvent.error(container.querySelector('img')!);

    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('Book title')).toBeInTheDocument();
  });

  it('draws the image without the designed cover frame', () => {
    const { container } = render(
      <BookCover imageUrl="/cover.jpg" title="Book title" variantKey="book-1" />,
    );

    const wrapper = container.querySelector('img')!.parentElement!;
    expect(wrapper.className).toContain('image');
    expect(wrapper.className).not.toContain('cover');
  });

  it('selects the same fallback variant for the same key', () => {
    expect(getBookCoverVariant('book-1')).toBe(getBookCoverVariant('book-1'));
  });

  it('shows the author name on the designed cover only when it is given', () => {
    const { rerender } = render(
      <BookCover author="سامي الحكيم" imageUrl={null} title="ظلال الحكاية" variantKey="a" />,
    );

    expect(screen.getByText('سامي الحكيم')).toBeInTheDocument();

    rerender(<BookCover imageUrl={null} title="ظلال الحكاية" variantKey="a" />);

    expect(screen.queryByText('سامي الحكيم')).toBeNull();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<BookCover title="Book title" variantKey="book-1" />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
