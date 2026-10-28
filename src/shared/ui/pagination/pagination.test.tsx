import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { axe } from '@/test/axe';

import { Pagination } from './pagination';

describe('Pagination', () => {
  const buildHref = (page: number) => `/catalog?page=${page}`;
  const props = { buildHref, label: 'Pages', nextLabel: 'Next', previousLabel: 'Previous' };

  it('renders page links with the current page and compact ellipses', () => {
    render(<Pagination {...props} page={6} totalPages={12} />);

    expect(screen.getByRole('navigation', { name: 'Pages' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '6' })).toHaveAttribute('href', '/catalog?page=6');
    expect(screen.getByRole('link', { name: '6' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getAllByText('…')).toHaveLength(2);
  });

  it('renders disabled ends as non-links and uses RTL-correct arrows', () => {
    const { container } = render(<Pagination {...props} page={1} totalPages={3} />);

    expect(screen.getByLabelText('Previous')).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByLabelText('Next')).toHaveAttribute('href', '/catalog?page=2');
    expect(container.querySelector('[aria-label="Previous"] svg')).toHaveAttribute(
      'viewBox',
      '0 0 24 24',
    );
  });

  it('has no accessibility violations', async () => {
    const { container, rerender } = render(<Pagination {...props} page={2} totalPages={3} />);

    expect(await axe(container)).toHaveNoViolations();

    rerender(<Pagination {...props} page={1} totalPages={3} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
