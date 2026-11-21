import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import messages from '@/i18n/messages/ar.json';
import { FeatureFlagsProvider, resolveFeatureFlags } from '@/shared/config/feature-flags';
import type { FeatureState } from '@/shared/config/features';
import { axe } from '@/test/axe';
import { buildOrder, buildPayment, orderFixtureId, paymentFixtureId } from '@/test/fixtures/orders';

const api = vi.hoisted(() => ({ submit: vi.fn(), open: vi.fn() }));
vi.mock('../api/payment-proof-api', () => ({ submitPaymentProof: api.submit }));
vi.mock('../lib/open-payment-receipt', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/open-payment-receipt')>()),
  openPaymentReceipt: api.open,
}));
vi.mock('@/modules/account', () => ({ UnconfirmedEmailBanner: () => <p>Confirm email</p> }));
import { OrderDetails } from './order-details';

const text = messages.orders;
const approved = buildPayment({ id: paymentFixtureId, status: 'Approved' });
const receiptButtons = () => screen.queryAllByRole('button', { name: text.receiptView });

function withFlag(key: 'payment-proof' | 'payment-receipt', state: FeatureState) {
  return { ...resolveFeatureFlags(null), [key]: state };
}

describe('order details: payment proof and receipt', () => {
  beforeEach(() => {
    api.submit.mockReset();
    api.open.mockReset().mockResolvedValue(undefined);
  });

  it('offers the receipt only for an approved payment and opens that payment', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <OrderDetails
        id={orderFixtureId}
        fixture={buildOrder({
          status: 'Confirmed',
          payments: [
            buildPayment({ id: 'p-rejected', status: 'Rejected', rejectionReason: 'blurry' }),
            approved,
            buildPayment({ id: 'p-pending', status: 'Pending' }),
          ],
        })}
      />,
    );

    expect(receiptButtons()).toHaveLength(1);
    expect(screen.getByText(/blurry/)).toBeInTheDocument();
    await user.click(receiptButtons()[0] as HTMLElement);
    expect(api.open).toHaveBeenCalledExactlyOnceWith(orderFixtureId, paymentFixtureId);
    expect(await axe(container)).toHaveNoViolations();
  });

  it.each(['Pending', 'Submitted', 'Rejected', 'Refunded'] as const)(
    'offers no receipt for a %s payment',
    (status) => {
      render(
        <OrderDetails
          id={orderFixtureId}
          fixture={buildOrder({ payments: [buildPayment({ status })] })}
        />,
      );

      expect(receiptButtons()).toHaveLength(0);
    },
  );

  it('dims the receipt button with the soon badge while payment-receipt is soon', () => {
    const { container } = render(
      <FeatureFlagsProvider value={withFlag('payment-receipt', 'soon')}>
        <OrderDetails
          id={orderFixtureId}
          fixture={buildOrder({ status: 'Confirmed', payments: [approved] })}
        />
      </FeatureFlagsProvider>,
    );

    const wrapper = container.querySelector('[data-feature="payment-receipt"]');
    expect(wrapper).toHaveAttribute('inert');
    expect(wrapper).toHaveTextContent(messages.site.soon);
  });

  it('shows the form, then "received" and the new status after a successful upload', async () => {
    api.submit.mockResolvedValue(
      buildOrder({
        status: 'PaymentReview',
        payments: [buildPayment({ status: 'Submitted', submittedAt: '2026-01-15T11:00:00Z' })],
      }),
    );
    const user = userEvent.setup({ applyAccept: false });
    const { container } = render(<OrderDetails id={orderFixtureId} fixture={buildOrder()} />);
    expect(screen.getByText(text.status.PendingPayment)).toBeInTheDocument();
    await user.upload(
      screen.getByLabelText(text.proofFile),
      new File(['x'], 'receipt.png', { type: 'image/png' }),
    );

    await user.click(screen.getByRole('button', { name: text.proofSubmit }));

    await waitFor(() => expect(screen.getByText(text.proofReceived)).toBeInTheDocument());
    expect(screen.queryByRole('form', { name: text.proofTitle })).toBeNull();
    expect(screen.getByText(text.status.PaymentReview)).toBeInTheDocument();
    expect(api.submit).toHaveBeenCalledTimes(1);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no upload form for a cash on delivery order', () => {
    render(
      <OrderDetails
        id={orderFixtureId}
        fixture={buildOrder({ paymentMethod: 'CashOnDelivery', payments: [] })}
      />,
    );

    expect(screen.queryByRole('form', { name: text.proofTitle })).toBeNull();
  });

  it('dims the upload form while payment-proof is soon', () => {
    const { container } = render(
      <FeatureFlagsProvider value={withFlag('payment-proof', 'soon')}>
        <OrderDetails id={orderFixtureId} fixture={buildOrder()} />
      </FeatureFlagsProvider>,
    );

    expect(container.querySelector('[data-feature="payment-proof"]')).toHaveAttribute('inert');
  });
});
