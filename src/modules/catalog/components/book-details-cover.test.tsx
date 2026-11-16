import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { axe } from '@/test/axe';

import { BookDetailsCover } from './book-details-cover';

const props = { author: 'سامي الحكيم', title: 'ظلال الحكاية', variantKey: 'shadows' };

describe('BookDetailsCover', () => {
  it('shows the real image when the API gives one', () => {
    const { container } = render(
      <BookDetailsCover {...props} imageUrl="https://res.cloudinary.com/demo/cover.jpg" />,
    );

    expect(container.querySelector('img')).toBeInTheDocument();
    expect(screen.queryByText(props.author)).toBeNull();
  });

  it('shows the designed cover with title and author when there is no image', () => {
    const { container } = render(<BookDetailsCover {...props} imageUrl={null} />);

    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText(props.title)).toBeInTheDocument();
    expect(screen.getByText(props.author)).toBeInTheDocument();
  });

  it('swaps to the designed cover, not a blank tile, when the image fails to load', () => {
    const { container } = render(
      <BookDetailsCover {...props} imageUrl="https://picsum.photos/seed/x/600/900" />,
    );

    fireEvent.error(container.querySelector('img') as HTMLImageElement);

    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText(props.title)).toBeInTheDocument();
    expect(screen.getByText(props.author)).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<BookDetailsCover {...props} imageUrl={null} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
