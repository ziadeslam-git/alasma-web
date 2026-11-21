import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import messages from '@/i18n/messages/ar.json';
import { axe } from '@/test/axe';
import { buildOrder, orderFixtureId } from '@/test/fixtures/orders';

const openInvoice = vi.hoisted(() => vi.fn());
vi.mock('../lib/open-order-invoice', () => ({ openOrderInvoice: openInvoice }));
vi.mock('@/modules/account', () => ({ UnconfirmedEmailBanner: () => <p>Confirm email</p> }));
import { OrderDetails } from './order-details';

const text = messages.orders;
const invoiceButtons = () => screen.queryAllByRole('button', { name: text.invoiceView });

describe('order details: invoice', () => {
  beforeEach(() => {
    openInvoice.mockReset().mockResolvedValue(undefined);
  });

  it('offers the invoice of a confirmed order and opens that order', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <OrderDetails id={orderFixtureId} fixture={buildOrder({ status: 'Confirmed' })} />,
    );

    expect(invoiceButtons()).toHaveLength(1);
    await user.click(invoiceButtons()[0] as HTMLElement);
    expect(openInvoice).toHaveBeenCalledExactlyOnceWith(orderFixtureId);
    expect(await axe(container)).toHaveNoViolations();
  });

  it.each(['PendingPayment', 'PaymentReview', 'Cancelled'] as const)(
    'hides the invoice action for a %s order',
    (status) => {
      render(<OrderDetails id={orderFixtureId} fixture={buildOrder({ status })} />);

      expect(invoiceButtons()).toHaveLength(0);
      expect(screen.queryByText(messages.site.soon)).toBeNull();
    },
  );
});
