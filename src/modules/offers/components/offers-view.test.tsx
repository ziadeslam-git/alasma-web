import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { axe } from '@/test/axe';

import type { Bundle } from '../api/offers-api';
import { OffersView } from './offers-view';

vi.mock('@/modules/catalog', () => ({
  BookGrid: ({ items }: { items: readonly { id: number; title: string }[] }) => (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{item.title}</li>
      ))}
    </ul>
  ),
}));

const text = messages.offers;
const bundle = (overrides: Partial<Bundle> = {}): Bundle => ({
  slug: 'bundle-1',
  title: 'Bundle One',
  imageUrl: null,
  description: 'Three novels',
  startsAt: '2026-11-01T00:00:00Z',
  endsAt: null,
  booksTotal: 410,
  price: 330,
  saving: 80,
  savingPercent: 19.5,
  stockStatus: 'InStock',
  books: [],
  ...overrides,
});
const book = { id: 1, title: 'Discounted Book' };

describe('OffersView', () => {
  it('shows the bundles with the API price, the old total and the saving, and the discounted books', async () => {
    const { container } = render(
      <OffersView
        bundles={{ status: 'ok', items: [bundle()] }}
        discounted={{ status: 'ok', items: [book] as never }}
      />,
    );

    expect(screen.getByRole('heading', { level: 1, name: text.heading })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: text.bundlesTitle })).toBeInTheDocument();
    expect(screen.getByText('330 ج.م')).toBeInTheDocument();
    expect(screen.getByText('410 ج.م')).toBeInTheDocument();
    expect(screen.getByText(text.save.replace('{amount}', '80 ج.م'))).toBeInTheDocument();
    expect(screen.getByText('Three novels')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: text.discountedTitle })).toBeInTheDocument();
    expect(screen.getByText('Discounted Book')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: text.viewAll })).toHaveAttribute('href', '/books');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('keeps the add-bundle button dimmed and inert (the public bundle has no id)', () => {
    render(
      <OffersView
        bundles={{ status: 'ok', items: [bundle()] }}
        discounted={{ status: 'empty', items: [] }}
      />,
    );

    expect(document.querySelector('[data-feature="bundle-add-to-cart"]')).toHaveAttribute('inert');
    expect(screen.getByText(text.addBundle)).toBeInTheDocument();
  });

  it('hides the saving when there is none and marks an unavailable bundle', () => {
    render(
      <OffersView
        bundles={{ status: 'ok', items: [bundle({ saving: 0, stockStatus: 'OutOfStock' })] }}
        discounted={{ status: 'empty', items: [] }}
      />,
    );

    expect(screen.queryByText(text.save.replace('{amount}', '0 ج.م'))).toBeNull();
    expect(screen.getByText(text.outOfStock)).toBeInTheDocument();
    expect(document.querySelector('[data-feature="bundle-add-to-cart"]')).toBeNull();
  });

  it('shows the empty state when there is nothing and an error message per failed section', () => {
    const { rerender } = render(
      <OffersView
        bundles={{ status: 'empty', items: [] }}
        discounted={{ status: 'empty', items: [] }}
      />,
    );
    expect(screen.getByText(text.emptyTitle)).toBeInTheDocument();

    rerender(
      <OffersView
        bundles={{ status: 'error', items: [] }}
        discounted={{ status: 'error', items: [] }}
      />,
    );
    expect(screen.getAllByRole('alert')).toHaveLength(2);
    expect(screen.queryByText(text.emptyTitle)).toBeNull();
  });
});
