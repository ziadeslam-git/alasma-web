import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import messages from '@/i18n/messages/ar.json';
import { axe } from '@/test/axe';
import { CartView } from './cart-view';

it('renders an empty cart accessibly', async () => {
  const { container } = render(<CartView readOnly cart={{ items: [], subtotal: 0 }} />);
  expect(screen.getByRole('heading', { level: 1, name: messages.cart.title })).toBeVisible();
  expect(screen.getByText(messages.cart.empty)).toBeVisible();
  expect(await axe(container)).toHaveNoViolations();
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
