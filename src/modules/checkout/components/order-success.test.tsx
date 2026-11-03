import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import messages from '@/i18n/messages/ar.json';
import type { Order } from '@/modules/orders';
import { axe } from '@/test/axe';
import { OrderSuccess } from './order-success';

vi.mock('@/modules/orders', () => ({ getOrder: vi.fn(), isOrderId: () => true }));
vi.mock('@/modules/account', () => ({ UnconfirmedEmailBanner: () => <p>Confirm email</p> }));

const order: Order = {
  id: '12345678-1234-1234-1234-123456789abc',
  orderNumber: 'ORD-1',
  status: 'PendingPayment',
  total: 100,
  itemsCount: 0,
  createdAt: '2026-01-15T10:00:00Z',
  canCancel: true,
  canEdit: true,
  items: [],
  address: {
    recipientName: 'Name',
    phone: '01000000000',
    shippingZoneId: 1,
    governorateName: 'Zone',
    city: 'City',
    addressLine: 'Street',
    landmark: null,
  },
  pricing: { subtotal: 100, couponCode: null, couponDiscount: 0, shippingFee: 0, total: 100 },
  paymentMethod: 'CashOnDelivery',
  payments: [],
  shipment: null,
  customerNotes: null,
  cancelReason: null,
  expiresAt: null,
  timeline: [],
  rowVersion: 'AA==',
};

describe('order success', () => {
  it('shows the CashOnDelivery order and has no detectable accessibility violations', async () => {
    const { container } = render(<OrderSuccess id={order.id} fixture={order} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      messages.checkout.orderSuccess,
    );
    expect(screen.getByText(order.orderNumber)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: messages.checkout.viewOrder })).toHaveAttribute(
      'href',
      `/account/orders/${order.id}`,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows the ManualTransfer order with transfer numbers and expiry accessibly', async () => {
    const manualOrder: Order = {
      ...order,
      paymentMethod: 'ManualTransfer',
      expiresAt: '2026-01-17T10:00:00Z',
    };
    const { container } = render(
      <OrderSuccess
        id={order.id}
        fixture={manualOrder}
        fixtureMethods={[
          {
            method: 'ManualTransfer',
            details: {
              transferNumbers: [{ channel: 'VodafoneCash', number: '01000000000' }],
              instructions: null,
              expiresInHours: 48,
            },
          },
        ]}
      />,
    );
    expect(screen.getByText('01000000000')).toHaveAttribute('dir', 'ltr');
    expect(await axe(container)).toHaveNoViolations();
  });

  it.each(['loading', 'not-found'] as const)(
    'renders the %s state accessibly',
    async (fixtureState) => {
      const { container } = render(<OrderSuccess id={order.id} fixtureState={fixtureState} />);
      expect(await axe(container)).toHaveNoViolations();
    },
  );
});
