import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import messages from '@/i18n/messages/ar.json';
import { FeatureFlagsProvider, resolveFeatureFlags } from '@/shared/config/feature-flags';
import type { FeatureState } from '@/shared/config/features';
import { ApiError } from '@/shared/lib/api';
import { axe } from '@/test/axe';
import { orderFixtureId } from '@/test/fixtures/orders';

const openInvoice = vi.hoisted(() => vi.fn());
vi.mock('../lib/open-order-invoice', () => ({ openOrderInvoice: openInvoice }));
import { PrintablePopupBlockedError } from '../lib/open-printable-page';
import { OrderInvoiceButton } from './order-invoice-button';

const text = messages.orders;
const invoiceButton = () => screen.queryByRole('button', { name: text.invoiceView });
const withInvoice = (state: FeatureState) => ({
  ...resolveFeatureFlags(null),
  'order-invoice': state,
});

describe('OrderInvoiceButton', () => {
  beforeEach(() => {
    openInvoice.mockReset();
  });

  it.each(['Confirmed', 'Preparing', 'Shipped', 'Delivered'] as const)(
    'is offered for a %s order, opens that order and has no accessibility violations',
    async (status) => {
      openInvoice.mockResolvedValue(undefined);
      const user = userEvent.setup();
      const { container } = render(<OrderInvoiceButton orderId={orderFixtureId} status={status} />);

      await user.click(screen.getByRole('button', { name: text.invoiceView }));

      expect(openInvoice).toHaveBeenCalledExactlyOnceWith(orderFixtureId);
      expect(screen.queryByRole('alert')).toBeNull();
      expect(await axe(container)).toHaveNoViolations();
    },
  );

  it.each(['PendingPayment', 'PaymentReview', 'Cancelled'] as const)(
    'is hidden for a %s order',
    (status) => {
      const { container } = render(<OrderInvoiceButton orderId={orderFixtureId} status={status} />);

      expect(invoiceButton()).toBeNull();
      expect(container).toBeEmptyDOMElement();
    },
  );

  it('is busy and not clickable again while the invoice is being prepared', async () => {
    let finish: () => void = () => undefined;
    openInvoice.mockImplementation(() => new Promise<void>((resolve) => (finish = resolve)));
    const user = userEvent.setup();
    render(<OrderInvoiceButton orderId={orderFixtureId} status="Confirmed" />);

    await user.click(screen.getByRole('button', { name: text.invoiceView }));

    const busy = screen.getByRole('button', { name: text.invoiceLoading });
    expect(busy).toBeDisabled();
    expect(busy).toHaveAttribute('aria-busy', 'true');
    finish();
    await waitFor(() => expect(invoiceButton()).toBeEnabled());
    expect(openInvoice).toHaveBeenCalledTimes(1);
  });

  it('shows the Arabic message of a 422 invoice_not_available', async () => {
    openInvoice.mockRejectedValue(
      new ApiError({ kind: 'problem', status: 422, code: 'invoice_not_available' }),
    );
    const user = userEvent.setup();
    const { container } = render(
      <OrderInvoiceButton orderId={orderFixtureId} status="Confirmed" />,
    );

    await user.click(screen.getByRole('button', { name: text.invoiceView }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      messages.apiErrors.codes.invoice_not_available,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('maps a 404 with no code (the closed Orders.InvoicePrint flag) to "not available now", never to order not found', async () => {
    openInvoice.mockRejectedValue(new ApiError({ kind: 'problem', status: 404 }));
    const user = userEvent.setup();
    render(<OrderInvoiceButton orderId={orderFixtureId} status="Delivered" />);

    await user.click(screen.getByRole('button', { name: text.invoiceView }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(text.invoiceUnavailable);
    expect(alert).not.toHaveTextContent(messages.apiErrors.codes.order_not_found);
  });

  it('keeps the "order not found" text for a 404 that carries order_not_found', async () => {
    openInvoice.mockRejectedValue(
      new ApiError({ kind: 'problem', status: 404, code: 'order_not_found' }),
    );
    const user = userEvent.setup();
    render(<OrderInvoiceButton orderId={orderFixtureId} status="Delivered" />);

    await user.click(screen.getByRole('button', { name: text.invoiceView }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      messages.apiErrors.codes.order_not_found,
    );
  });

  it('shows the API text for 429 and 403 email_not_confirmed', async () => {
    openInvoice.mockRejectedValueOnce(new ApiError({ kind: 'problem', status: 429 }));
    const user = userEvent.setup();
    render(<OrderInvoiceButton orderId={orderFixtureId} status="Delivered" />);

    await user.click(screen.getByRole('button', { name: text.invoiceView }));
    expect(await screen.findByRole('alert')).toHaveTextContent(messages.apiErrors.status['429']);

    openInvoice.mockRejectedValueOnce(
      new ApiError({ kind: 'problem', status: 403, code: 'email_not_confirmed' }),
    );
    await user.click(screen.getByRole('button', { name: text.invoiceView }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        messages.apiErrors.codes.email_not_confirmed,
      ),
    );
  });

  it('asks to allow pop-ups when the tab was blocked', async () => {
    openInvoice.mockRejectedValue(new PrintablePopupBlockedError());
    const user = userEvent.setup();
    render(<OrderInvoiceButton orderId={orderFixtureId} status="Confirmed" />);

    await user.click(screen.getByRole('button', { name: text.invoiceView }));

    expect(await screen.findByRole('alert')).toHaveTextContent(text.receiptPopupBlocked);
  });

  it('uses the API text for other failures and clears the old message on a new try', async () => {
    openInvoice.mockRejectedValueOnce(new ApiError({ kind: 'network' }));
    openInvoice.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    render(<OrderInvoiceButton orderId={orderFixtureId} status="Confirmed" />);

    await user.click(screen.getByRole('button', { name: text.invoiceView }));
    expect(await screen.findByRole('alert')).toHaveTextContent(messages.apiErrors.kind.network);

    await user.click(screen.getByRole('button', { name: text.invoiceView }));
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  });

  it('dims the button with the soon badge while order-invoice is soon', () => {
    const { container } = render(
      <FeatureFlagsProvider value={withInvoice('soon')}>
        <OrderInvoiceButton orderId={orderFixtureId} status="Confirmed" />
      </FeatureFlagsProvider>,
    );

    expect(container.querySelector('[data-feature="order-invoice"]')).not.toBeNull();
    expect(screen.getByText(messages.site.soon)).toBeInTheDocument();
  });

  it('renders the live button without a soon badge when order-invoice is live', () => {
    const { container } = render(
      <FeatureFlagsProvider value={withInvoice('live')}>
        <OrderInvoiceButton orderId={orderFixtureId} status="Confirmed" />
      </FeatureFlagsProvider>,
    );

    expect(invoiceButton()).toBeEnabled();
    expect(container.querySelector('[data-feature="order-invoice"]')).toBeNull();
  });
});
