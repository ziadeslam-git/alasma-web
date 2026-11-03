import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import messages from '@/i18n/messages/ar.json';
import { axe } from '@/test/axe';
import { AddressStep, type AddressStepFixtures } from './address-step';

const { setAddressId, beginPreviewRequest } = vi.hoisted(() => ({
  setAddressId: vi.fn(),
  beginPreviewRequest: vi.fn(() => 1),
}));
vi.mock('../provider/checkout-provider', () => ({
  useCheckout: () => ({
    addressId: null,
    setAddressId,
    appliedCouponCode: null,
    setPreview: vi.fn(),
    beginPreviewRequest,
    isCurrentPreviewRequest: vi.fn(() => true),
    setEmailUnconfirmed: vi.fn(),
  }),
}));

const fixtures: AddressStepFixtures = {
  addresses: [
    {
      id: 4,
      recipientName: 'Test Recipient',
      phone: '01012345678',
      shippingZoneId: 1,
      governorateName: 'Example',
      city: 'Example City',
      addressLine: 'Example Address',
      landmark: null,
      isDefault: true,
    },
  ],
  zones: [
    {
      id: 1,
      nameAr: 'Example',
      nameEn: 'Example',
      shippingPrice: 20,
      freeShippingThreshold: null,
      estimatedDays: null,
    },
  ],
};

describe('checkout address step', () => {
  it('selects the default saved address, allows explicit selection, and passes axe', async () => {
    const { container } = render(<AddressStep fixtures={fixtures} />);
    expect(setAddressId).toHaveBeenCalledWith(4);
    fireEvent.click(screen.getByRole('radio', { name: /Test Recipient/ }));
    expect(beginPreviewRequest).toHaveBeenCalled();
    expect(setAddressId).toHaveBeenCalledWith(4);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows the address form when no address exists and passes axe', async () => {
    const { container } = render(<AddressStep fixtures={{ ...fixtures, addresses: [] }} />);
    expect(screen.getByLabelText(messages.addresses.recipientName)).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
