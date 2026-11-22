import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import messages from '@/i18n/messages/ar.json';
import { FeatureFlagsProvider, resolveFeatureFlags } from '@/shared/config/feature-flags';
import type { FeatureState } from '@/shared/config/features';
import { axe } from '@/test/axe';
import { buildOrder, buildPayment } from '@/test/fixtures/orders';

vi.mock('../api/payment-proof-api', () => ({ submitPaymentProof: vi.fn() }));
vi.mock('@/modules/account', () => ({ UnconfirmedEmailBanner: () => <p>Confirm email</p> }));
import { PaymentProofSection } from './payment-proof-section';

const text = messages.orders;
const form = () => screen.queryByRole('form', { name: text.proofTitle });
const received = () => screen.queryByText(text.proofReceived);

function states(proof: FeatureState) {
  return { ...resolveFeatureFlags(null), 'payment-proof': proof };
}

// The fixture order expires at 2026-01-17T10:00:00Z: the clock is set before it unless a test moves it.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-01-10T10:00:00Z'));
});
afterEach(() => {
  vi.useRealTimers();
});

describe('PaymentProofSection', () => {
  it('shows the rejection reason above the form again after a rejection (a new Pending payment exists)', () => {
    render(
      <PaymentProofSection
        order={buildOrder({
          payments: [
            buildPayment({ id: 'p1', status: 'Rejected', rejectionReason: 'الصورة غير واضحة' }),
            buildPayment({ id: 'p2', status: 'Pending' }),
          ],
        })}
        onOrderChange={vi.fn()}
      />,
    );

    expect(screen.getByText(text.proofRejectedTitle)).toBeInTheDocument();
    expect(
      screen.getByText(text.proofRejectedReason.replace('{reason}', 'الصورة غير واضحة')),
    ).toBeInTheDocument();
    expect(form()).toBeInTheDocument();
  });

  it('shows no rejection notice when nothing was rejected', () => {
    render(<PaymentProofSection order={buildOrder()} onOrderChange={vi.fn()} />);

    expect(screen.queryByText(text.proofRejectedTitle)).toBeNull();
  });

  it('hides the form once expiresAt has passed, even after a rejection', () => {
    vi.setSystemTime(new Date('2026-01-18T10:00:00Z'));
    const { container } = render(
      <PaymentProofSection
        order={buildOrder({
          payments: [
            buildPayment({ id: 'p1', status: 'Rejected', rejectionReason: 'x' }),
            buildPayment({ id: 'p2', status: 'Pending' }),
          ],
        })}
        onOrderChange={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('hides the form while the new proof is under review and for an approved order', () => {
    const { container, rerender } = render(
      <PaymentProofSection
        order={buildOrder({
          status: 'PaymentReview',
          payments: [
            buildPayment({ id: 'p1', status: 'Rejected', rejectionReason: 'x' }),
            buildPayment({ id: 'p2', status: 'Submitted' }),
          ],
        })}
        onOrderChange={vi.fn()}
      />,
    );
    expect(form()).toBeNull();
    expect(received()).toBeInTheDocument();

    rerender(
      <PaymentProofSection
        order={buildOrder({
          status: 'Confirmed',
          payments: [buildPayment({ status: 'Approved' })],
        })}
        onOrderChange={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the upload form for a ManualTransfer order that waits for its receipt', async () => {
    const { container } = render(
      <PaymentProofSection order={buildOrder()} onOrderChange={vi.fn()} />,
    );

    expect(form()).toBeInTheDocument();
    expect(received()).toBeNull();
    expect(container.querySelector('[data-feature="payment-proof"]')).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows nothing for a cash on delivery order', () => {
    const { container } = render(
      <PaymentProofSection
        order={buildOrder({ paymentMethod: 'CashOnDelivery', payments: [] })}
        onOrderChange={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it.each([
    ['PaymentReview', 'Submitted'],
    ['PendingPayment', 'Submitted'],
  ] as const)('shows "received" for an order in %s with a %s payment', async (status, payment) => {
    const { container } = render(
      <PaymentProofSection
        order={buildOrder({ status, payments: [buildPayment({ status: payment })] })}
        onOrderChange={vi.fn()}
      />,
    );

    expect(received()).toBeInTheDocument();
    expect(form()).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it.each([
    ['a rejected payment, no second upload', 'PendingPayment', 'Rejected'],
    ['an approved payment', 'Confirmed', 'Approved'],
    ['a cancelled order', 'Cancelled', 'Pending'],
    ['a shipped order', 'Shipped', 'Approved'],
  ] as const)('shows neither the form nor "received" for %s', (_label, status, payment) => {
    const { container } = render(
      <PaymentProofSection
        order={buildOrder({
          status,
          payments: [buildPayment({ status: payment, rejectionReason: 'blurry' })],
        })}
        onOrderChange={vi.fn()}
      />,
    );

    expect(form()).toBeNull();
    expect(received()).toBeNull();
    expect(container).toBeEmptyDOMElement();
  });

  it('keeps the form inert with the soon badge while the payment-proof flag is soon', () => {
    const { container } = render(
      <FeatureFlagsProvider value={states('soon')}>
        <PaymentProofSection order={buildOrder()} onOrderChange={vi.fn()} />
      </FeatureFlagsProvider>,
    );

    const wrapper = container.querySelector('[data-feature="payment-proof"]');
    expect(wrapper).toHaveAttribute('aria-disabled', 'true');
    expect(wrapper).toHaveAttribute('inert');
    expect(wrapper).toHaveTextContent(messages.site.soon);
  });

  it('renders nothing while the payment-proof flag is hidden', () => {
    const { container } = render(
      <FeatureFlagsProvider value={states('hidden')}>
        <PaymentProofSection order={buildOrder()} onOrderChange={vi.fn()} />
      </FeatureFlagsProvider>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('works normally while the flag is live', () => {
    const { container } = render(
      <FeatureFlagsProvider value={states('live')}>
        <PaymentProofSection order={buildOrder()} onOrderChange={vi.fn()} />
      </FeatureFlagsProvider>,
    );

    expect(form()).toBeInTheDocument();
    expect(container.querySelector('[data-feature="payment-proof"]')).toBeNull();
  });
});
