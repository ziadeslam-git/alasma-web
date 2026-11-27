import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import messages from '@/i18n/messages/ar.json';
import { axe } from '@/test/axe';
import { AddressesView } from './addresses-view';

it('renders an accessible empty address list', async () => {
  const { container } = render(<AddressesView fixtures={{ addresses: [], zones: [] }} />);
  expect(screen.getByRole('heading', { level: 1, name: messages.addresses.title })).toBeVisible();
  expect(screen.getByText(messages.addresses.emptyTitle)).toBeVisible();
  expect(await axe(container)).toHaveNoViolations();
});

it('shows the cards, the add tile named without its hint, and the zone prices from the API', async () => {
  const { container } = render(
    <AddressesView
      fixtures={{
        addresses: [
          {
            id: 1,
            recipientName: 'A',
            phone: '01012345678',
            shippingZoneId: 1,
            governorateName: 'G',
            city: 'C',
            addressLine: 'L',
            landmark: null,
            isDefault: true,
          },
        ],
        zones: [
          {
            id: 1,
            nameAr: 'Z',
            nameEn: '',
            shippingPrice: 35,
            freeShippingThreshold: null,
            estimatedDays: 2,
          },
        ],
      }}
    />,
  );
  expect(screen.getByRole('button', { name: messages.addresses.add })).toBeVisible();
  expect(screen.getByRole('button', { name: messages.addresses.delete })).toBeVisible();
  const table = screen.getByRole('table');
  expect(table).toHaveTextContent('Z');
  expect(table).toHaveTextContent('2 يوم عمل');
  expect(table).toHaveTextContent('35');
  expect(await axe(container)).toHaveNoViolations();
});
