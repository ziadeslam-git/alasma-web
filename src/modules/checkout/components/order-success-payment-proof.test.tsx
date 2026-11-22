import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import messages from '@/i18n/messages/ar.json';
import { FeatureFlagsProvider, resolveFeatureFlags } from '@/shared/config/feature-flags';
import { axe } from '@/test/axe';
import { buildOrder, buildPayment, orderFixtureId } from '@/test/fixtures/orders';

const submit = vi.hoisted(() => vi.fn());
vi.mock('@/modules/orders', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/modules/orders')>();
  return { ...original, getOrder: vi.fn(), isOrderId: () => true };
});
vi.mock('@/modules/orders/api/payment-proof-api', () => ({ submitPaymentProof: submit }));
vi.mock('@/modules/account', () => ({ UnconfirmedEmailBanner: () => <p>Confirm email</p> }));
import { OrderSuccess } from './order-success';

const text = messages.orders;
const methods = [
  {
    method: 'ManualTransfer' as const,
    details: {
      transferNumbers: [{ channel: 'VodafoneCash' as const, number: '01000000000' }],
      instructions: null,
      expiresInHours: 48,
    },
  },
];

describe('order success: transfer receipt upload', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    // The fixture order expires after this date: the clock is set before it so the form is still offered.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-01-10T10:00:00Z'));
    submit.mockReset();
  });

  it('shows the upload form under the transfer numbers and moves to "received" after the upload', async () => {
    submit.mockResolvedValue(
      buildOrder({ status: 'PaymentReview', payments: [buildPayment({ status: 'Submitted' })] }),
    );
    const user = userEvent.setup({ applyAccept: false });
    const { container } = render(
      <OrderSuccess id={orderFixtureId} fixture={buildOrder()} fixtureMethods={methods} />,
    );
    expect(screen.getByRole('form', { name: text.proofTitle })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();

    await user.upload(
      screen.getByLabelText(text.proofFile),
      new File(['x'], 'receipt.png', { type: 'image/png' }),
    );
    await user.click(screen.getByRole('button', { name: text.proofSubmit }));

    await waitFor(() => expect(screen.getByText(text.proofReceived)).toBeInTheDocument());
    expect(screen.getByText(text.status.PaymentReview)).toBeInTheDocument();
    expect(screen.queryByRole('form', { name: text.proofTitle })).toBeNull();
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it('has no upload form for a cash on delivery order', () => {
    render(
      <OrderSuccess
        id={orderFixtureId}
        fixture={buildOrder({ paymentMethod: 'CashOnDelivery', payments: [] })}
      />,
    );

    expect(screen.queryByRole('form', { name: text.proofTitle })).toBeNull();
  });

  it('dims the upload form while payment-proof is soon', () => {
    const { container } = render(
      <FeatureFlagsProvider value={{ ...resolveFeatureFlags(null), 'payment-proof': 'soon' }}>
        <OrderSuccess id={orderFixtureId} fixture={buildOrder()} fixtureMethods={methods} />
      </FeatureFlagsProvider>,
    );

    expect(container.querySelector('[data-feature="payment-proof"]')).toHaveAttribute('inert');
  });
});
