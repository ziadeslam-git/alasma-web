import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import messages from '@/i18n/messages/ar.json';
import { axe } from '@/test/axe';
import { OrderDetails } from './order-details';

const getOrder = vi.hoisted(() => vi.fn());
vi.mock('../api/orders-api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/orders-api')>()),
  getOrder,
}));
it('renders an accessible not-found state for an invalid GUID without requesting the API', async () => {
  const { container } = render(<OrderDetails id="invalid" />);
  expect(
    screen.getByRole('heading', { name: messages.orders.details, level: 1 }),
  ).toBeInTheDocument();
  expect(screen.getByText(messages.orders.notFound)).toBeInTheDocument();
  expect(getOrder).not.toHaveBeenCalled();
  expect(await axe(container)).toHaveNoViolations();
});
