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
