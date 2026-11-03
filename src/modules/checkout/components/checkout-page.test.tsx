import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import messages from '@/i18n/messages/ar.json';
import { CheckoutPage } from './checkout-page';

const state = vi.hoisted(() => ({ isUnconfirmed: false }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock('@/modules/auth', () => ({
  getAuthApi: () => ({ me: () => Promise.resolve({ emailConfirmed: true }) }),
}));
vi.mock('@/modules/cart', () => ({
  useCart: () => ({ cart: { items: [{ itemId: 1 }] }, isLoading: false, error: null }),
}));
vi.mock('@/modules/account', () => ({ UnconfirmedEmailBanner: () => <p>Confirm email</p> }));
vi.mock('../provider/checkout-provider', () => ({
  useCheckout: () => ({ isEmailUnconfirmed: state.isUnconfirmed }),
}));
vi.mock('./address-step', () => ({ AddressStep: () => <p>Address fields</p> }));
vi.mock('./coupon-box', () => ({ CouponBox: () => <p>Coupon fields</p> }));
vi.mock('./notes-field', () => ({ NotesField: () => null }));
vi.mock('./order-summary', () => ({ OrderSummary: () => null }));
vi.mock('./payment-method-picker', () => ({ PaymentMethodPicker: () => null }));
vi.mock('./place-order', () => ({ PlaceOrderButton: () => <button>Place</button> }));

describe('checkout confirmation guard', () => {
  it('hides the complete form after a checkout operation reports an unconfirmed email', async () => {
    state.isUnconfirmed = false;
    const { rerender } = render(<CheckoutPage />);
    expect(await screen.findByText('Address fields')).toBeInTheDocument();
    state.isUnconfirmed = true;
    rerender(<CheckoutPage />);
    expect(screen.getByText('Confirm email')).toBeInTheDocument();
    expect(screen.queryByText('Address fields')).not.toBeInTheDocument();
    expect(screen.queryByText('Coupon fields')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Place' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: messages.checkout.title })).toBeInTheDocument();
  });
});
