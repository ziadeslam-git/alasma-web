import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import messages from '@/i18n/messages/ar.json';
import { ApiError } from '@/shared/lib/api';
import { formatNumber } from '@/shared/lib/format';
import { axe } from '@/test/axe';
import { PlaceOrderButton } from './place-order';

const state = vi.hoisted(() => ({
  cart: { items: [{ itemId: 1, quantity: 2 }] } as {
    items: Array<{ itemId: number; quantity: number }>;
  } | null,
  addressId: 1 as number | null,
  appliedCouponCode: null as string | null,
  paymentMethod: 'CashOnDelivery' as 'CashOnDelivery' | 'ManualTransfer' | null,
  notes: '',
  preview: { status: 'ok' } as { status: 'idle' | 'loading' | 'ok' | 'error' },
}));

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  notify: vi.fn(),
  createOrder: vi.fn(),
  getPurchaseKey: vi.fn(),
  clear: vi.fn(),
  setUnconfirmed: vi.fn(),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock('@/modules/account', () => ({ UnconfirmedEmailBanner: () => <p>Confirm email</p> }));
vi.mock('@/modules/cart', () => ({
  useCart: () => ({ cart: state.cart, error: null }),
  notifyCartChanged: mocks.notify,
}));
vi.mock('../api/create-order', () => ({ createOrder: mocks.createOrder }));
vi.mock('../provider/checkout-provider', () => ({
  useCheckout: () => ({
    addressId: state.addressId,
    appliedCouponCode: state.appliedCouponCode,
    paymentMethod: state.paymentMethod,
    notes: state.notes,
    preview: state.preview,
    getPurchaseKey: mocks.getPurchaseKey,
    clearPurchaseAttempt: mocks.clear,
    setEmailUnconfirmed: mocks.setUnconfirmed,
  }),
}));

describe('placing an order', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.cart = { items: [{ itemId: 1, quantity: 2 }] };
    state.addressId = 1;
    state.appliedCouponCode = null;
    state.paymentMethod = 'CashOnDelivery';
    state.notes = '';
    state.preview = { status: 'ok' };
    mocks.getPurchaseKey.mockResolvedValue('key');
  });

  it('disables the button while the preview is not ok, the payment method or address is missing, or a request is in flight', async () => {
    state.preview = { status: 'loading' };
    const { rerender, container } = render(<PlaceOrderButton />);
    expect(screen.getByRole('button', { name: messages.checkout.placeOrder })).toBeDisabled();

    state.preview = { status: 'ok' };
    state.paymentMethod = null;
    rerender(<PlaceOrderButton />);
    expect(screen.getByRole('button', { name: messages.checkout.placeOrder })).toBeDisabled();

    state.paymentMethod = 'CashOnDelivery';
    state.addressId = null;
    rerender(<PlaceOrderButton />);
    expect(screen.getByRole('button', { name: messages.checkout.placeOrder })).toBeDisabled();

    state.addressId = 1;
    rerender(<PlaceOrderButton />);
    expect(screen.getByRole('button', { name: messages.checkout.placeOrder })).toBeEnabled();
    expect(await axe(container)).toHaveNoViolations();
  });

  it.each([
    ['201 Created', { id: '12345678-1234-1234-1234-123456789abc' }],
    ['200 OK', { id: '12345678-1234-1234-1234-123456789abc' }],
    ['Idempotency-Replayed: true', { id: '12345678-1234-1234-1234-123456789abc', replayed: true }],
  ])('treats %s as success, clears attempt, refreshes cart and navigates', async (_case, order) => {
    mocks.createOrder.mockResolvedValue(order);
    render(<PlaceOrderButton />);
    fireEvent.click(screen.getByRole('button', { name: messages.checkout.placeOrder }));
    await waitFor(() => expect(mocks.clear).toHaveBeenCalledOnce());
    expect(mocks.notify).toHaveBeenCalledOnce();
    expect(mocks.push).toHaveBeenCalledWith(`/checkout/success/${order.id}`);
  });

  it('signals the checkout guard when the email is unconfirmed', async () => {
    mocks.createOrder.mockRejectedValue(
      new ApiError({ kind: 'problem', status: 403, code: 'email_not_confirmed' }),
    );
    render(<PlaceOrderButton />);
    fireEvent.click(screen.getByRole('button', { name: messages.checkout.placeOrder }));
    await waitFor(() => expect(mocks.setUnconfirmed).toHaveBeenCalledWith(true));
  });

  it('submits once on a double click and clears the attempt after success', async () => {
    let resolveOrder: (order: { id: string }) => void = () => {};
    mocks.createOrder.mockReturnValue(
      new Promise((resolve) => {
        resolveOrder = resolve;
      }),
    );
    render(<PlaceOrderButton />);
    const button = screen.getByRole('button', { name: messages.checkout.placeOrder });
    fireEvent.click(button);
    fireEvent.click(button);
    await waitFor(() => expect(mocks.createOrder).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button', { name: messages.checkout.placingOrder })).toBeDisabled();
    resolveOrder({ id: '12345678-1234-1234-1234-123456789abc' });
    await waitFor(() => expect(mocks.clear).toHaveBeenCalledOnce());
    expect(mocks.notify).toHaveBeenCalledOnce();
    expect(mocks.push).toHaveBeenCalledOnce();
  });

  it('clears a mismatched attempt, asks for a new confirmation, and uses a new key on retry', async () => {
    let seq = 0;
    mocks.getPurchaseKey.mockImplementation(async () => `key-${++seq}`);
    mocks.createOrder
      .mockRejectedValueOnce(
        new ApiError({ kind: 'problem', status: 422, code: 'idempotency_key_mismatch' }),
      )
      .mockResolvedValueOnce({ id: '12345678-1234-1234-1234-123456789abc' });
    render(<PlaceOrderButton />);
    fireEvent.click(screen.getByRole('button', { name: messages.checkout.placeOrder }));
    expect(await screen.findByRole('alert')).toHaveTextContent(messages.checkout.confirmAgain);
    expect(mocks.clear).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: messages.checkout.placeOrder }));
    await waitFor(() => expect(mocks.createOrder).toHaveBeenCalledTimes(2));
    expect(mocks.createOrder.mock.calls[0]?.[1]).toBe('key-1');
    expect(mocks.createOrder.mock.calls[1]?.[1]).toBe('key-2');
  });

  it('keeps the key after a network failure and permits retry with the same key', async () => {
    mocks.createOrder
      .mockRejectedValueOnce(new ApiError({ kind: 'network' }))
      .mockResolvedValueOnce({ id: '12345678-1234-1234-1234-123456789abc' });
    render(<PlaceOrderButton />);
    fireEvent.click(screen.getByRole('button', { name: messages.checkout.placeOrder }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(mocks.clear).not.toHaveBeenCalled();
    const button = screen.getByRole('button', { name: messages.checkout.placeOrder });
    expect(button).toBeEnabled();

    fireEvent.click(button);
    await waitFor(() => expect(mocks.createOrder).toHaveBeenCalledTimes(2));
    expect(mocks.createOrder.mock.calls[0]?.[1]).toBe('key');
    expect(mocks.createOrder.mock.calls[1]?.[1]).toBe('key');
  });

  it('offers retry on coupon_busy with the same key', async () => {
    mocks.createOrder
      .mockRejectedValueOnce(new ApiError({ kind: 'problem', status: 409, code: 'coupon_busy' }))
      .mockResolvedValueOnce({ id: '12345678-1234-1234-1234-123456789abc' });
    render(<PlaceOrderButton />);
    fireEvent.click(screen.getByRole('button', { name: messages.checkout.placeOrder }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      messages.apiErrors.codes.coupon_busy,
    );
    expect(mocks.clear).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: messages.checkout.placeOrder }));
    await waitFor(() => expect(mocks.createOrder).toHaveBeenCalledTimes(2));
    expect(mocks.createOrder.mock.calls[1]?.[1]).toBe('key');
  });

  it('retries an in-progress attempt with the same key', async () => {
    mocks.createOrder
      .mockRejectedValueOnce(
        new ApiError({
          kind: 'problem',
          status: 409,
          code: 'idempotency_in_progress',
          retryAfterSeconds: 0,
        }),
      )
      .mockResolvedValueOnce({ id: '12345678-1234-1234-1234-123456789abc' });
    render(<PlaceOrderButton />);
    fireEvent.click(screen.getByRole('button', { name: messages.checkout.placeOrder }));
    await waitFor(() => expect(mocks.createOrder).toHaveBeenCalledTimes(2));
    expect(mocks.createOrder.mock.calls[0]?.[1]).toBe('key');
    expect(mocks.createOrder.mock.calls[1]?.[1]).toBe('key');
    await waitFor(() => expect(mocks.clear).toHaveBeenCalledOnce());
  });

  it('shows stock shortages with each book availableQuantity and a link to the cart', async () => {
    mocks.createOrder.mockRejectedValue(
      new ApiError({
        kind: 'problem',
        status: 409,
        code: 'stock_insufficient',
        books: [
          { bookId: 1, title: 'First Book', availableQuantity: 2 },
          { bookId: 2, title: 'Second Book', availableQuantity: 0 },
        ],
      }),
    );
    const { container } = render(<PlaceOrderButton />);
    fireEvent.click(screen.getByRole('button', { name: messages.checkout.placeOrder }));
    expect(await screen.findByText(/First Book/)).toHaveTextContent(
      messages.cart.available.replace('{count}', formatNumber(2)),
    );
    expect(screen.getByText(/Second Book/)).toHaveTextContent(
      messages.cart.available.replace('{count}', formatNumber(0)),
    );
    expect(screen.getByRole('link', { name: messages.checkout.returnToCart })).toHaveAttribute(
      'href',
      '/cart',
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows unavailable cart items and a link to the cart', async () => {
    mocks.createOrder.mockRejectedValue(
      new ApiError({
        kind: 'problem',
        status: 409,
        code: 'cart_has_unavailable_items',
        items: [{ itemId: 1, title: 'Unavailable book' }],
      }),
    );
    render(<PlaceOrderButton />);
    fireEvent.click(screen.getByRole('button', { name: messages.checkout.placeOrder }));
    expect(await screen.findByText('Unavailable book')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: messages.checkout.returnToCart })).toHaveAttribute(
      'href',
      '/cart',
    );
  });

  it('shows the existing email-confirmation state', async () => {
    mocks.createOrder.mockRejectedValue(
      new ApiError({ kind: 'problem', status: 403, code: 'email_not_confirmed' }),
    );
    render(<PlaceOrderButton />);
    fireEvent.click(screen.getByRole('button', { name: messages.checkout.placeOrder }));
    expect(await screen.findByText('Confirm email')).toBeInTheDocument();
  });
});
