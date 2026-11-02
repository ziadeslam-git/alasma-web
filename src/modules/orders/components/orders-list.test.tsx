import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import messages from '@/i18n/messages/ar.json';
import { axe } from '@/test/axe';
import { OrdersList } from './orders-list';

it('renders an accessible empty list and status navigation', async () => {
  const { container } = render(
    <OrdersList fixtures={{ items: [], page: 1, pageSize: 48, totalCount: 0 }} />,
  );
  expect(
    screen.getByRole('heading', { level: 1, name: messages.orders.title }),
  ).toBeInTheDocument();
  expect(screen.getByText(messages.orders.empty)).toBeInTheDocument();
  expect(await axe(container)).toHaveNoViolations();
});
