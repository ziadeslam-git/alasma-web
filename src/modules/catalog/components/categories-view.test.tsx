import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import messages from '@/i18n/messages/ar.json';
import { axe } from '@/test/axe';
import { CategoriesView } from './categories-view';

const refresh = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));

it('renders top-level category links with accessible structure', async () => {
  const { container } = render(
    <CategoriesView
      result={{
        status: 'ok',
        categories: [
          { id: 1, name: 'Category', slug: 'one', imageUrl: null, bookCount: 0, children: [] },
        ],
      }}
    />,
  );
  expect(screen.getByRole('link', { name: 'Category' })).toHaveAttribute('href', '/categories/one');
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  expect(await axe(container)).toHaveNoViolations();
});

it('shows the empty state for an empty list and the error state with retry for a failed load', async () => {
  const user = userEvent.setup();
  const { rerender } = render(<CategoriesView result={{ status: 'ok', categories: [] }} />);
  expect(screen.getByText(messages.home.categories.emptyTitle)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: messages.site.loadError.retry })).toBeNull();

  rerender(<CategoriesView result={{ status: 'error' }} />);
  expect(screen.getByText(messages.home.categories.errorTitle)).toBeInTheDocument();
  expect(screen.queryByText(messages.home.categories.emptyTitle)).toBeNull();
  await user.click(screen.getByRole('button', { name: messages.site.loadError.retry }));
  expect(refresh).toHaveBeenCalledOnce();
});
