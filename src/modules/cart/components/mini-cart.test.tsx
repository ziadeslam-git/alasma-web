import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { axe } from '@/test/axe';

import type { Cart } from '../api/cart-api';
import { MiniCart } from './mini-cart';

const mocks = vi.hoisted(() => ({
  state: { cart: null as unknown, isLoading: false, error: null as unknown },
}));

vi.mock('./use-cart', () => ({ useCart: () => mocks.state }));
vi.mock('@/modules/account', () => ({ UnconfirmedEmailBanner: () => <p>unconfirmed</p> }));

const line = (itemId: number, quantity: number) => ({
  itemId,
  kind: 'Book',
  title: `Book ${itemId}`,
  slug: `book-${itemId}`,
  coverImageUrl: null,
  quantity,
  unitPrice: 100,
  listUnitPrice: 100,
  lineTotal: 100 * quantity,
  discountPercent: 0,
  productId: itemId,
  warnings: [],
});
const cartOf = (...quantities: number[]) =>
  ({ items: quantities.map((quantity, index) => line(index + 1, quantity)), subtotal: 0 }) as Cart;

describe('MiniCart counter', () => {
  beforeEach(() => {
    mocks.state = { cart: null, isLoading: false, error: null };
  });

  it('counts books: the sum of the line quantities, not the number of lines', async () => {
    mocks.state = { cart: cartOf(2, 1), isLoading: false, error: null };
    const { container } = render(<MiniCart />);

    const button = screen.getByRole('button', {
      name: messages.site.header.cartWithCount.replace('{count}', '3'),
    });
    expect(button).toHaveTextContent('3');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows one line of three copies as 3', () => {
    mocks.state = { cart: cartOf(3), isLoading: false, error: null };
    render(<MiniCart />);

    expect(screen.getByRole('button', { name: /3/ })).toHaveTextContent('3');
  });

  it('keeps the plain label and a zero badge for an empty cart, and no badge before the cart is read', () => {
    mocks.state = { cart: cartOf(), isLoading: false, error: null };
    const { rerender } = render(<MiniCart />);
    const emptyButton = screen.getByRole('button', { name: messages.site.header.cart });
    expect(emptyButton).toHaveTextContent('0');

    mocks.state = { cart: null, isLoading: true, error: null };
    rerender(<MiniCart />);
    expect(screen.getByRole('button', { name: messages.site.header.cart })).not.toHaveTextContent(
      /\d/,
    );
  });
});
