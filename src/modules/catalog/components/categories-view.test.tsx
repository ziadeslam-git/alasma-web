import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { axe } from '@/test/axe';
import { CategoriesView } from './categories-view';

it('renders top-level category links with accessible structure', async () => {
  const { container } = render(
    <CategoriesView
      categories={[{ id: 1, name: 'Category', slug: 'one', imageUrl: null, children: [] }]}
    />,
  );
  expect(screen.getByRole('link', { name: 'Category' })).toHaveAttribute('href', '/categories/one');
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  expect(await axe(container)).toHaveNoViolations();
});
