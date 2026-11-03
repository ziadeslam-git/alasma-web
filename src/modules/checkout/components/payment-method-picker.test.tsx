import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import messages from '@/i18n/messages/ar.json';
import { ApiError } from '@/shared/lib/api';
import { axe } from '@/test/axe';
import { PaymentMethodPicker } from './payment-method-picker';

const mocks = vi.hoisted(() => ({ methods: vi.fn(), setMethod: vi.fn(), setUnconfirmed: vi.fn() }));
vi.mock('../api/payment-methods', () => ({ getPaymentMethods: mocks.methods }));
vi.mock('../provider/checkout-provider', () => ({
  useCheckout: () => ({
    paymentMethod: null,
    setPaymentMethod: mocks.setMethod,
    setEmailUnconfirmed: mocks.setUnconfirmed,
  }),
}));
vi.mock('@/modules/account', () => ({ UnconfirmedEmailBanner: () => <p>Confirm email</p> }));

describe('payment methods', () => {
  it('renders transfer details from the API, selects the method, and passes axe', async () => {
    mocks.methods.mockResolvedValue([
      { method: 'CashOnDelivery', details: null },
      {
        method: 'ManualTransfer',
        details: {
          transferNumbers: [
            { channel: 'VodafoneCash', number: '01000000000' },
            { channel: 'InstaPay', number: '01111111111' },
          ],
          instructions: 'Send receipt later',
          expiresInHours: 24,
        },
      },
    ]);
    const { container } = render(<PaymentMethodPicker />);
    const method = await screen.findByRole('radio', { name: messages.checkout.manualTransfer });
    expect(screen.getByText('01000000000')).toHaveAttribute('dir', 'ltr');
    expect(screen.getByText('01111111111')).toHaveAttribute('dir', 'ltr');
    expect(screen.getByText('Send receipt later')).toBeInTheDocument();
    fireEvent.click(method);
    expect(mocks.setMethod).toHaveBeenCalledWith('ManualTransfer');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('blocks ordering with a message when the payment methods list is empty and passes axe', async () => {
    mocks.methods.mockResolvedValue([]);
    const { container } = render(<PaymentMethodPicker />);
    expect(await screen.findByText(messages.checkout.paymentEmpty)).toBeInTheDocument();
    expect(mocks.setMethod).toHaveBeenCalledWith(null);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows the error state accessibly when loading fails', async () => {
    mocks.methods.mockRejectedValue(new ApiError({ kind: 'network' }));
    const { container } = render(<PaymentMethodPicker />);
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
