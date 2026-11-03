import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import messages from '@/i18n/messages/ar.json';
import { ApiError } from '@/shared/lib/api';
import { axe } from '@/test/axe';
import { CouponBox } from './coupon-box';

const state = vi.hoisted(() => ({
  addressId: 3 as number | null,
  appliedCouponCode: null as string | null,
}));
const mocks = vi.hoisted(() => ({
  preview: vi.fn(),
  setCoupon: vi.fn(),
  setPreview: vi.fn(),
  setUnconfirmed: vi.fn(),
}));
vi.mock('../api/preview', () => ({ previewCheckout: mocks.preview }));
vi.mock('@/modules/account', () => ({ UnconfirmedEmailBanner: () => <p>Confirm email</p> }));
vi.mock('../provider/checkout-provider', () => ({
  useCheckout: () => ({
    addressId: state.addressId,
    appliedCouponCode: state.appliedCouponCode,
    setAppliedCouponCode: mocks.setCoupon,
    setPreview: mocks.setPreview,
    beginPreviewRequest: () => 1,
    isCurrentPreviewRequest: () => true,
    setEmailUnconfirmed: mocks.setUnconfirmed,
  }),
}));

const couponCodes = [
  'coupon_below_minimum',
  'coupon_busy',
  'coupon_exceeds_subtotal',
  'coupon_exhausted',
  'coupon_expired',
  'coupon_inactive',
  'coupon_not_found',
  'coupon_not_started',
  'coupon_user_limit_reached',
] as const;

describe('coupon application', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.addressId = 3;
    state.appliedCouponCode = null;
  });

  it('applies the returned preview and coupon and passes axe', async () => {
    const response = { total: 123 };
    mocks.preview.mockResolvedValue(response);
    const { container } = render(<CouponBox />);
    fireEvent.change(screen.getByLabelText(messages.checkout.couponLabel), {
      target: { value: 'WELCOME10' },
    });
    fireEvent.click(screen.getByRole('button', { name: messages.checkout.couponApply }));
    await waitFor(() => expect(mocks.setCoupon).toHaveBeenCalledWith('WELCOME10'));
    expect(mocks.preview).toHaveBeenCalledWith({
      addressId: 3,
      zoneId: null,
      couponCode: 'WELCOME10',
    });
    expect(mocks.setPreview).toHaveBeenCalledWith({ status: 'ok', data: response });
    expect(await axe(container)).toHaveNoViolations();
  });

  it.each(couponCodes)('shows the mapped %s error and does not apply it', async (code) => {
    mocks.preview.mockRejectedValue(
      new ApiError({ kind: 'problem', status: code === 'coupon_not_found' ? 404 : 422, code }),
    );
    render(<CouponBox />);
    fireEvent.change(screen.getByLabelText(messages.checkout.couponLabel), {
      target: { value: 'BAD' },
    });
    fireEvent.click(screen.getByRole('button', { name: messages.checkout.couponApply }));
    expect(await screen.findByRole('alert')).toHaveTextContent(messages.apiErrors.codes[code]);
    expect(mocks.setCoupon).not.toHaveBeenCalled();
  });

  it('removes an applied coupon and refreshes the preview with couponCode null', async () => {
    state.appliedCouponCode = 'WELCOME10';
    const response = { total: 150 };
    mocks.preview.mockResolvedValue(response);
    const { container } = render(<CouponBox />);
    expect(screen.getByText('WELCOME10')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: messages.checkout.couponRemove }));
    await waitFor(() => expect(mocks.setCoupon).toHaveBeenCalledWith(null));
    expect(mocks.preview).toHaveBeenCalledWith({
      addressId: 3,
      zoneId: null,
      couponCode: null,
    });
    expect(mocks.setPreview).toHaveBeenCalledWith({ status: 'ok', data: response });
    expect(await axe(container)).toHaveNoViolations();
  });
});
