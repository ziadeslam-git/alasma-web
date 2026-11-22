import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { ApiError } from '@/shared/lib/api';
import { axe } from '@/test/axe';

import type { Order, OrderList, OrderStatus } from '../api/orders-api';
import { OrderDetails } from './order-details';
import { OrdersList } from './orders-list';

const api = vi.hoisted(() => ({
  listOrders: vi.fn(),
  getOrder: vi.fn(),
  updateOrder: vi.fn(),
  cancelOrder: vi.fn(),
  listOrderZones: vi.fn(),
}));
vi.mock('../api/orders-api', async (original) => ({
  ...(await original<typeof import('../api/orders-api')>()),
  ...api,
}));
vi.mock('@/modules/account', () => ({ UnconfirmedEmailBanner: () => <p>unconfirmed</p> }));

const text = messages.orders;
const build = (status: OrderStatus, overrides: Partial<Order> = {}): Order => ({
  id: '12345678-1234-1234-1234-123456789abc',
  orderNumber: 'AS-1',
  status,
  total: 265,
  itemsCount: 2,
  createdAt: '2026-10-10T10:00:00Z',
  canCancel: false,
  canEdit: false,
  items: [
    {
      type: 'Book',
      bookId: 1,
      bundleId: null,
      title: 'Book One',
      isbn: null,
      unitPrice: 140,
      discountPercent: 0,
      finalUnitPrice: 140,
      quantity: 2,
      lineTotal: 280,
      components: [],
    },
  ],
  address: {
    recipientName: 'Reader',
    phone: '01012345678',
    shippingZoneId: 1,
    governorateName: 'Alexandria',
    city: 'City',
    addressLine: 'Street',
    landmark: null,
  },
  pricing: { subtotal: 225, couponCode: null, couponDiscount: 0, shippingFee: 40, total: 265 },
  paymentMethod: 'CashOnDelivery',
  payments: [],
  shipment: null,
  customerNotes: null,
  cancelReason: null,
  expiresAt: null,
  timeline: [{ status: 'PendingPayment', at: '2026-10-10T10:00:00Z' }],
  rowVersion: 'AA==',
  ...overrides,
});

describe('order details design', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    // The fixture order expires after this date: the clock is set before it so the form is still offered.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-01T10:00:00Z'));
    vi.clearAllMocks();
    api.listOrderZones.mockResolvedValue([]);
  });

  it('shows the header, the pill, the tracker and the panels with the API amounts', async () => {
    const order = build('Shipped', {
      shipment: {
        carrierName: 'Carrier',
        trackingNumber: 'TRK-1',
        shippedAt: '2026-10-12T10:00:00Z',
        deliveredAt: null,
      },
    });
    const { container } = render(<OrderDetails fixture={order} id={order.id} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      `${text.orderPrefix} #AS-1`,
    );
    expect(screen.getByRole('link', { name: new RegExp(text.title) })).toHaveAttribute(
      'href',
      '/account/orders',
    );
    expect(screen.getAllByText(text.status.Shipped).length).toBeGreaterThan(0);
    const steps = within(screen.getByRole('list', { name: text.trackerLabel })).getAllByRole(
      'listitem',
    );
    expect(steps).toHaveLength(4);
    expect(steps[2]).toHaveAttribute('aria-current', 'step');
    expect(screen.getByText('TRK-1')).toBeInTheDocument();
    expect(screen.getByText('280 ج.م')).toBeInTheDocument();
    expect(screen.getByText('225 ج.م')).toBeInTheDocument();
    expect(screen.getByText('265 ج.م')).toBeInTheDocument();
    expect(screen.getByText(text.paymentMethods.CashOnDelivery)).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('draws a cancelled order with the cancelled tone and no shipping line', () => {
    const order = build('Cancelled');
    render(<OrderDetails fixture={order} id={order.id} />);

    const steps = within(screen.getByRole('list', { name: text.trackerLabel })).getAllByRole(
      'listitem',
    );
    expect(steps.every((step) => step.className.includes('stepCancelled'))).toBe(true);
    expect(screen.queryByText(text.notShipped)).toBeNull();
  });

  it('shows the expiry note for a pending manual transfer and the proof form', () => {
    const order = build('PendingPayment', {
      paymentMethod: 'ManualTransfer',
      expiresAt: '2026-10-12T10:00:00Z',
      payments: [
        {
          id: 'a0000000-1234-1234-1234-123456789abc',
          method: 'ManualTransfer',
          status: 'Pending',
          amount: 265,
          submittedAt: null,
          rejectionReason: null,
        },
      ],
    });
    render(<OrderDetails fixture={order} id={order.id} />);

    expect(screen.getByText(/12 أكتوبر 2026/)).toBeInTheDocument();
    expect(screen.getByLabelText(text.proofFile)).toBeInTheDocument();
  });

  it('offers edit and cancel only when the API allows them, and a hint when it does not', () => {
    const { unmount } = render(
      <OrderDetails
        fixture={build('PendingPayment', { canEdit: true, canCancel: true })}
        id="12345678-1234-1234-1234-123456789abc"
      />,
    );
    expect(screen.getByRole('button', { name: text.edit })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: text.cancel })).toBeInTheDocument();
    expect(screen.queryByText(text.actionsHint)).toBeNull();

    unmount();
    render(<OrderDetails fixture={build('Shipped')} id="12345678-1234-1234-1234-123456789abc" />);
    expect(screen.queryByRole('button', { name: text.edit })).toBeNull();
    expect(screen.getByText(text.actionsHint)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: text.newOrder })).toHaveAttribute('href', '/books');
  });

  it('shows an error as an alert strip and keeps the page', async () => {
    const user = userEvent.setup();
    const order = build('PendingPayment', { canCancel: true });
    api.cancelOrder.mockRejectedValue(new ApiError({ kind: 'network' }));
    render(<OrderDetails fixture={order} id={order.id} />);

    await user.click(screen.getByRole('button', { name: text.cancel }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: text.cancel }));

    expect(await screen.findByRole('alert')).toHaveTextContent(messages.apiErrors.kind.network);
  });
});

const listOf = (status?: OrderStatus): OrderList => ({
  items: [
    {
      id: '12345678-1234-1234-1234-123456789abc',
      orderNumber: 'AS-7',
      status: status ?? 'PendingPayment',
      total: 405,
      itemsCount: 3,
      createdAt: '2026-10-12T10:00:00Z',
      canCancel: true,
    },
  ],
  page: 1,
  pageSize: 48,
  totalCount: 8,
});

describe('orders list design', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows the heading, the total card from the API, the soon cards and the order card', async () => {
    const { container } = render(<OrdersList fixtures={listOf()} />);

    expect(screen.getByRole('heading', { level: 1, name: text.title })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: text.newOrder })).toHaveAttribute('href', '/books');
    const total = screen.getByText(text.statsTotal).closest('div') as HTMLElement;
    expect(within(total).getByText('8')).toBeInTheDocument();
    expect(document.querySelector('[data-feature="orders-stats"]')).toHaveAttribute('inert');
    expect(screen.getByText('#AS-7')).toBeInTheDocument();
    expect(screen.getByText('405 ج.م')).toBeInTheDocument();
    expect(screen.getByText(text.booksCountValue.replace('{count}', '3'))).toBeInTheDocument();
    expect(screen.getByRole('link', { name: text.details })).toHaveAttribute(
      'href',
      '/account/orders/12345678-1234-1234-1234-123456789abc',
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('does not present a filtered count as the total', () => {
    render(<OrdersList fixtures={listOf('Shipped')} status="Shipped" />);

    const total = screen.getByText(text.statsTotal).closest('div') as HTMLElement;
    expect(within(total).queryByText('8')).toBeNull();
    expect(
      screen.getByRole('link', { name: text.status.Shipped }).getAttribute('aria-current'),
    ).toBe('page');
  });

  it('shows the segmented filter with every API status', () => {
    render(<OrdersList fixtures={listOf()} />);

    const nav = screen.getByRole('navigation', { name: text.statusLabel });
    expect(within(nav).getAllByRole('link')).toHaveLength(8);
    expect(within(nav).getByRole('link', { name: text.tabAll })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('shows an alert strip with a retry that reads the list again', async () => {
    const user = userEvent.setup();
    api.listOrders.mockRejectedValueOnce(new ApiError({ kind: 'network' }));
    api.listOrders.mockResolvedValueOnce(listOf());
    render(<OrdersList />);

    expect(await screen.findByRole('alert')).toHaveTextContent(messages.apiErrors.kind.network);
    await user.click(screen.getByRole('button', { name: text.retry }));

    expect(await screen.findByText('#AS-7')).toBeInTheDocument();
    expect(api.listOrders).toHaveBeenCalledTimes(2);
  });
});
