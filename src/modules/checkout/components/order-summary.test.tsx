import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import messages from '@/i18n/messages/ar.json';
import { formatMoney } from '@/shared/lib/format';
import { axe } from '@/test/axe';
import type { PreviewState } from '../provider/checkout-provider';
import { OrderSummary } from './order-summary';

const state = vi.hoisted(() => ({
  preview: {
    status: 'ok',
    data: {
      items: [
        {
          kind: 'Book',
          bookId: 1,
          bundleId: null,
          title: 'Book',
          unitPrice: 37.5,
          quantity: 2,
          lineTotal: 75,
          warning: 'unavailable',
          availableQuantity: 1,
        },
      ],
      subtotal: 75,
      couponCode: null,
      couponDiscount: 5,
      shippingFee: 10,
      total: 80,
      freeShippingApplied: true,
      zone: { id: 1, governorate: 'Cairo', shippingFee: 10, freeShippingThreshold: null },
    },
  } as PreviewState,
}));

vi.mock('../provider/checkout-provider', () => ({
  useCheckout: () => ({ preview: state.preview }),
}));

describe('order summary', () => {
  it('displays API values, warnings, zone, and free shipping accessibly', async () => {
    state.preview = {
      status: 'ok',
      data: {
        items: [
          {
            kind: 'Book',
            bookId: 1,
            bundleId: null,
            title: 'Book',
            unitPrice: 37.5,
            quantity: 2,
            lineTotal: 75,
            warning: 'unavailable',
            availableQuantity: 1,
          },
        ],
        subtotal: 75,
        couponCode: null,
        couponDiscount: 5,
        shippingFee: 10,
        total: 80,
        freeShippingApplied: true,
        zone: { id: 1, governorate: 'Cairo', shippingFee: 10, freeShippingThreshold: null },
      },
    };
    const { container } = render(<OrderSummary />);
    expect(screen.getByText(formatMoney(80))).toBeInTheDocument();
    expect(screen.getByText('Cairo')).toBeInTheDocument();
    expect(screen.getByText(messages.checkout.freeShipping)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(messages.cart.unavailable);
    expect(await axe(container)).toHaveNoViolations();
  });

  it.each([
    ['idle', { status: 'idle' } as const],
    ['loading', { status: 'loading' } as const],
    ['error', { status: 'error', message: messages.checkout.previewError } as const],
  ])('renders %s state accessibly', async (_label, previewState) => {
    state.preview = previewState;
    const { container } = render(<OrderSummary />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
