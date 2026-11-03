import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { ApiError, getApiErrorMessage } from '@/shared/lib/api';
import { axe } from '@/test/axe';
import type { Order } from '../api/orders-api';
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
    recipientName: 'Original',
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

describe('order interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.listOrderZones.mockResolvedValue([{ id: 1, nameAr: 'Zone' }]);
    api.getOrder.mockResolvedValue(order);
    api.updateOrder.mockResolvedValue(order);
    api.cancelOrder.mockResolvedValue(order);
  });

  it('edits only a changed recipient and its row version', async () => {
    const user = userEvent.setup();
    const { container } = render(<OrderDetails id={order.id} fixture={order} />);
    await user.click(screen.getByRole('button', { name: messages.orders.edit }));
    const dialog = screen.getByRole('dialog');
    const input = within(dialog).getByLabelText(messages.orders.recipientName);
    await user.clear(input);
    await user.type(input, 'Changed');
    await user.click(within(dialog).getByRole('button', { name: messages.orders.save }));
    expect(api.updateOrder).toHaveBeenCalledWith(order.id, {
      rowVersion: 'AA==',
      recipientName: 'Changed',
    });
    expect(await axe(container)).toHaveNoViolations();
  });

  it('locks the zone unless the order is pending payment', async () => {
    const user = userEvent.setup();
    render(<OrderDetails id={order.id} fixture={{ ...order, status: 'PaymentReview' }} />);
    await user.click(screen.getByRole('button', { name: messages.orders.edit }));
    expect(screen.getByLabelText(messages.orders.zone)).toBeDisabled();
  });

  it.each(['order_zone_change_locked', 'order_not_editable'])(
    'shows the mapped %s edit error',
    async (code) => {
      const user = userEvent.setup();
      const error = new ApiError({ kind: 'problem', status: 422, code });
      api.updateOrder.mockRejectedValue(error);
      render(<OrderDetails id={order.id} fixture={order} />);
      await user.click(screen.getByRole('button', { name: messages.orders.edit }));
      const input = screen.getByLabelText(messages.orders.recipientName);
      await user.type(input, 'x');
      await user.click(screen.getByRole('button', { name: messages.orders.save }));
      expect(await screen.findByRole('alert')).toHaveTextContent(getApiErrorMessage(error));
    },
  );

  it('reloads the order after a concurrency conflict', async () => {
    const user = userEvent.setup();
    api.updateOrder.mockRejectedValue(
      new ApiError({ kind: 'problem', status: 409, code: 'order_concurrency_conflict' }),
    );
    render(<OrderDetails id={order.id} fixture={order} />);
    await user.click(screen.getByRole('button', { name: messages.orders.edit }));
    await user.type(screen.getByLabelText(messages.orders.recipientName), 'x');
    await user.click(screen.getByRole('button', { name: messages.orders.save }));
    await waitFor(() => expect(api.getOrder).toHaveBeenCalledWith(order.id));
    expect(await screen.findByText(messages.orders.changed)).toBeInTheDocument();
  });

  it('confirms cancellation and displays a non-cancellable error', async () => {
    const user = userEvent.setup();
    const error = new ApiError({ kind: 'problem', status: 422, code: 'order_not_cancellable' });
    api.cancelOrder.mockRejectedValue(error);
    render(<OrderDetails id={order.id} fixture={order} />);
    await user.click(screen.getByRole('button', { name: messages.orders.cancel }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent(messages.orders.confirmCancel);
    expect(api.cancelOrder).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole('button', { name: messages.orders.cancel }));
    expect(await screen.findByRole('alert')).toHaveTextContent(getApiErrorMessage(error));
    expect(api.cancelOrder).toHaveBeenCalledWith(order.id);
  });

  it('shows the network error message when listOrders fails with a network error', async () => {
    const netError = new ApiError({ kind: 'network' });
    api.listOrders.mockRejectedValue(netError);
    render(<OrdersList />);
    expect(await screen.findByRole('alert')).toHaveTextContent(getApiErrorMessage(netError));
  });

  it('shows the network error message when getOrder fails with a network error', async () => {
    const netError = new ApiError({ kind: 'network' });
    api.getOrder.mockRejectedValue(netError);
    render(<OrderDetails id={order.id} />);
    expect(await screen.findByRole('alert')).toHaveTextContent(getApiErrorMessage(netError));
  });

  it('shows the network error message when listOrderZones fails with a network error', async () => {
    const user = userEvent.setup();
    const netError = new ApiError({ kind: 'network' });
    api.listOrderZones.mockRejectedValue(netError);
    render(<OrderDetails id={order.id} fixture={order} />);
    await user.click(screen.getByRole('button', { name: messages.orders.edit }));
    expect(await screen.findByRole('alert')).toHaveTextContent(getApiErrorMessage(netError));
  });

  it('shows the network error message when updateOrder fails with a network error', async () => {
    const user = userEvent.setup();
    const netError = new ApiError({ kind: 'network' });
    api.updateOrder.mockRejectedValue(netError);
    render(<OrderDetails id={order.id} fixture={order} />);
    await user.click(screen.getByRole('button', { name: messages.orders.edit }));
    await user.type(screen.getByLabelText(messages.orders.recipientName), 'x');
    await user.click(screen.getByRole('button', { name: messages.orders.save }));
    expect(await screen.findByRole('alert')).toHaveTextContent(getApiErrorMessage(netError));
  });

  it('shows the network error message when cancelOrder fails with a network error', async () => {
    const user = userEvent.setup();
    const netError = new ApiError({ kind: 'network' });
    api.cancelOrder.mockRejectedValue(netError);
    render(<OrderDetails id={order.id} fixture={order} />);
    await user.click(screen.getByRole('button', { name: messages.orders.cancel }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: messages.orders.cancel }));
    expect(await screen.findByRole('alert')).toHaveTextContent(getApiErrorMessage(netError));
  });
});
