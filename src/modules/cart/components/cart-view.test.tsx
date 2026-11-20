import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import messages from '@/i18n/messages/ar.json';
import { ApiError, getApiErrorMessage } from '@/shared/lib/api';
import { routes } from '@/shared/config/routes';
import { axe } from '@/test/axe';
import * as cartApi from '../api/cart-api';
import { CartView } from './cart-view';

it('renders an empty cart accessibly', async () => {
  const { container } = render(<CartView readOnly cart={{ items: [], subtotal: 0 }} />);
  expect(screen.getByRole('heading', { level: 1, name: messages.cart.title })).toBeVisible();
  expect(screen.getByText(messages.cart.empty)).toBeVisible();
  expect(screen.getByRole('link', { name: messages.cart.browseStore })).toHaveAttribute(
    'href',
    routes.books,
  );
  expect(await axe(container)).toHaveNoViolations();
});

it('keeps a coupon error beside the field without clearing a cart error, then clears it on edit', async () => {
  const remove = vi.spyOn(cartApi, 'removeItem').mockRejectedValueOnce(new Error('failed'));
  const couponFailure = new ApiError({ kind: 'problem', status: 404 });
  const validate = vi.spyOn(cartApi, 'validateCoupon').mockRejectedValueOnce(couponFailure);
  try {
    render(
      <CartView
        cart={{
          subtotal: 25,
          items: [
            {
              itemId: 1,
              kind: 'Book',
              productId: 1,
              slug: 'book',
              title: 'Book',
              coverImageUrl: null,
              quantity: 1,
              listUnitPrice: 25,
              unitPrice: 25,
              lineTotal: 25,
              discountPercent: 0,
              warnings: [],
            },
          ],
        }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: messages.cart.remove }));
    expect(await screen.findByRole('alert')).toHaveTextContent(messages.cart.error);
    const field = screen.getByLabelText(messages.cart.coupon);
    fireEvent.change(field, { target: { value: 'INVALID' } });
    fireEvent.click(screen.getByRole('button', { name: messages.cart.apply }));
    const couponSection = field.closest('div');
    expect(couponSection).not.toBeNull();
    const alert = await within(couponSection as HTMLElement).findByRole('alert');
    expect(alert).toHaveTextContent(getApiErrorMessage(couponFailure));
    expect(field).toHaveAttribute('aria-describedby', alert.id);
    expect(screen.getAllByRole('alert')).toHaveLength(2);
    fireEvent.change(field, { target: { value: 'OTHER' } });
    await waitFor(() =>
      expect(within(couponSection as HTMLElement).queryByRole('alert')).toBeNull(),
    );
    expect(screen.getByRole('alert')).toHaveTextContent(messages.cart.error);
  } finally {
    remove.mockRestore();
    validate.mockRestore();
  }
});

it('shows API line prices and warnings accessibly', async () => {
  const { container } = render(
    <CartView
      readOnly
      cart={{
        subtotal: 25,
        items: [
          {
            itemId: 1,
            kind: 'Book',
            productId: 1,
            slug: 'book',
            title: 'Book',
            coverImageUrl: null,
            quantity: 1,
            listUnitPrice: 30,
            unitPrice: 25,
            lineTotal: 25,
            discountPercent: 10,
            warnings: [{ code: 'out_of_stock', availableQuantity: 0 }],
          },
        ],
      }}
    />,
  );
  expect(screen.getByText(messages.cart.outOfStock, { exact: false })).toBeVisible();
  expect(container).toHaveTextContent('25');
  expect(await axe(container)).toHaveNoViolations();
});
