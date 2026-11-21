import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import messages from '@/i18n/messages/ar.json';
import { ApiError } from '@/shared/lib/api';
import { axe } from '@/test/axe';
import { orderFixtureId, paymentFixtureId } from '@/test/fixtures/orders';

const openReceipt = vi.hoisted(() => vi.fn());
vi.mock('../lib/open-payment-receipt', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/open-payment-receipt')>()),
  openPaymentReceipt: openReceipt,
}));
import { ReceiptPopupBlockedError } from '../lib/open-payment-receipt';
import { PaymentReceiptButton } from './payment-receipt-button';

const text = messages.orders;

describe('PaymentReceiptButton', () => {
  beforeEach(() => {
    openReceipt.mockReset();
  });

  it('opens the receipt of its payment and has no accessibility violations', async () => {
    openReceipt.mockResolvedValue(undefined);
    const user = userEvent.setup();
    const { container } = render(
      <PaymentReceiptButton orderId={orderFixtureId} paymentId={paymentFixtureId} />,
    );

    await user.click(screen.getByRole('button', { name: text.receiptView }));

    expect(openReceipt).toHaveBeenCalledExactlyOnceWith(orderFixtureId, paymentFixtureId);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('is busy and not clickable again while the receipt is being prepared', async () => {
    let finish: () => void = () => undefined;
    openReceipt.mockImplementation(() => new Promise<void>((resolve) => (finish = resolve)));
    const user = userEvent.setup();
    render(<PaymentReceiptButton orderId={orderFixtureId} paymentId={paymentFixtureId} />);

    await user.click(screen.getByRole('button', { name: text.receiptView }));

    const busy = screen.getByRole('button', { name: text.receiptLoading });
    expect(busy).toBeDisabled();
    expect(busy).toHaveAttribute('aria-busy', 'true');
    finish();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: text.receiptView })).toBeEnabled(),
    );
    expect(openReceipt).toHaveBeenCalledTimes(1);
  });

  it('shows the Arabic message of a 422 payment_receipt_not_available', async () => {
    openReceipt.mockRejectedValue(
      new ApiError({ kind: 'problem', status: 422, code: 'payment_receipt_not_available' }),
    );
    const user = userEvent.setup();
    const { container } = render(
      <PaymentReceiptButton orderId={orderFixtureId} paymentId={paymentFixtureId} />,
    );

    await user.click(screen.getByRole('button', { name: text.receiptView }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      messages.apiErrors.codes.payment_receipt_not_available,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('maps a 404 with no code (the closed Orders.InvoicePrint flag) to "not available right now"', async () => {
    openReceipt.mockRejectedValue(new ApiError({ kind: 'problem', status: 404 }));
    const user = userEvent.setup();
    render(<PaymentReceiptButton orderId={orderFixtureId} paymentId={paymentFixtureId} />);

    await user.click(screen.getByRole('button', { name: text.receiptView }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(text.receiptUnavailable);
    expect(alert).not.toHaveTextContent(messages.apiErrors.codes.order_not_found);
  });

  it.each([
    ['order_not_found', messages.apiErrors.codes.order_not_found],
    ['payment_not_found', messages.apiErrors.codes.payment_not_found],
  ])('keeps the own text of a 404 %s', async (code, expected) => {
    openReceipt.mockRejectedValue(new ApiError({ kind: 'problem', status: 404, code }));
    const user = userEvent.setup();
    render(<PaymentReceiptButton orderId={orderFixtureId} paymentId={paymentFixtureId} />);

    await user.click(screen.getByRole('button', { name: text.receiptView }));

    expect(await screen.findByRole('alert')).toHaveTextContent(expected);
  });

  it('asks to allow pop-ups when the tab was blocked', async () => {
    openReceipt.mockRejectedValue(new ReceiptPopupBlockedError());
    const user = userEvent.setup();
    render(<PaymentReceiptButton orderId={orderFixtureId} paymentId={paymentFixtureId} />);

    await user.click(screen.getByRole('button', { name: text.receiptView }));

    expect(await screen.findByRole('alert')).toHaveTextContent(text.receiptPopupBlocked);
  });

  it('uses the API text for other failures and clears the old message on a new try', async () => {
    openReceipt.mockRejectedValueOnce(new ApiError({ kind: 'network' }));
    openReceipt.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    render(<PaymentReceiptButton orderId={orderFixtureId} paymentId={paymentFixtureId} />);

    await user.click(screen.getByRole('button', { name: text.receiptView }));
    expect(await screen.findByRole('alert')).toHaveTextContent(messages.apiErrors.kind.network);

    await user.click(screen.getByRole('button', { name: text.receiptView }));
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  });
});
