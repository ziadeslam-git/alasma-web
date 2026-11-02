import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { ApiError } from '@/shared/lib/api';
import { AddressForm } from './address-form';

const zone = {
  id: 1,
  nameAr: 'Zone',
  nameEn: 'Zone',
  shippingPrice: 25,
  freeShippingThreshold: 100,
  estimatedDays: 3,
};

it('validates required fields and Egyptian phone before saving', () => {
  const save = vi.fn();
  render(<AddressForm zones={[zone]} onSave={save} onCancel={() => undefined} />);
  const phone = screen.getByLabelText(messages.addresses.phone);
  const shippingZone = screen.getByLabelText(messages.addresses.shippingZoneId);
  fireEvent.change(phone, { target: { value: '123' } });
  fireEvent.click(screen.getByRole('button', { name: messages.addresses.save }));
  expect(phone).toHaveAttribute('aria-invalid', 'true');
  expect(shippingZone).toHaveAttribute('aria-invalid', 'true');
  expect(save).not.toHaveBeenCalled();
});

it('maps server validation errors onto the corresponding fields', async () => {
  const save = vi
    .fn()
    .mockRejectedValue(
      new ApiError({ kind: 'problem', status: 422, errors: { Phone: ['invalid'] } }),
    );
  render(<AddressForm zones={[zone]} onSave={save} onCancel={() => undefined} />);
  const phone = screen.getByLabelText(messages.addresses.phone);
  for (const [field, value] of [
    ['recipientName', 'Name'],
    ['phone', '01012345678'],
    ['city', 'City'],
    ['addressLine', 'Street'],
  ] as const)
    fireEvent.change(screen.getByLabelText(messages.addresses[field]), { target: { value } });
  fireEvent.change(screen.getByLabelText(messages.addresses.shippingZoneId), {
    target: { value: '1' },
  });
  fireEvent.click(screen.getByRole('button', { name: messages.addresses.save }));
  await waitFor(() => expect(phone).toHaveAttribute('aria-invalid', 'true'));
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ shippingZoneId: 1 }));
});

it('shows the confirmation banner after an email-not-confirmed response', async () => {
  const save = vi
    .fn()
    .mockRejectedValue(new ApiError({ kind: 'problem', status: 403, code: 'email_not_confirmed' }));
  const { container } = render(
    <AddressForm zones={[zone]} onSave={save} onCancel={() => undefined} />,
  );
  for (const [field, value] of [
    ['recipientName', 'Name'],
    ['phone', '01012345678'],
    ['city', 'City'],
    ['addressLine', 'Street'],
  ] as const)
    fireEvent.change(screen.getByLabelText(messages.addresses[field]), { target: { value } });
  fireEvent.change(screen.getByLabelText(messages.addresses.shippingZoneId), {
    target: { value: '1' },
  });
  fireEvent.click(screen.getByRole('button', { name: messages.addresses.save }));
  await waitFor(() => expect(screen.getByText(messages.account.unconfirmed)).toBeVisible());
  expect(container.querySelector('[data-feature="resend-confirmation"]')).toHaveAttribute('inert');
});
