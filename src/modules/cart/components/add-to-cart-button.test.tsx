import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import messages from '@/i18n/messages/ar.json';
import { ApiError } from '@/shared/lib/api';
import { CART_CHANGED_EVENT } from '../cart-events';
import { AddToCartButton } from './add-to-cart-button';

const mocks = vi.hoisted(() => ({
  status: 'anonymous',
  push: vi.fn(),
  show: vi.fn(),
  add: vi.fn(),
}));
vi.mock('@/modules/auth', () => ({ useAuth: () => ({ status: mocks.status }) }));
vi.mock('next/navigation', () => ({
  usePathname: () => '/books/example',
  useRouter: () => ({ push: mocks.push }),
}));
vi.mock('@/shared/ui/toast', () => ({ useToast: () => ({ show: mocks.show }) }));
vi.mock('../api/cart-api', () => ({ addBook: mocks.add }));

describe('AddToCartButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.status = 'anonymous';
  });
  it('redirects anonymous visitors to login with a return path', async () => {
    render(<AddToCartButton bookId={1} title="Book" />);
    await userEvent.click(screen.getByRole('button'));
    expect(mocks.push).toHaveBeenCalledWith('/login?next=%2Fbooks%2Fexample');
    expect(mocks.add).not.toHaveBeenCalled();
  });
  it('announces success and updates the mini cart', async () => {
    mocks.status = 'authenticated';
    mocks.add.mockResolvedValue(undefined);
    const changed = vi.fn();
    window.addEventListener(CART_CHANGED_EVENT, changed);
    render(<AddToCartButton bookId={1} title="Book" />);
    await userEvent.click(screen.getByRole('button'));
    await waitFor(() =>
      expect(mocks.show).toHaveBeenCalledWith(
        messages.cart.added,
        expect.objectContaining({ kind: 'success' }),
      ),
    );
    expect(changed).toHaveBeenCalledOnce();
    window.removeEventListener(CART_CHANGED_EVENT, changed);
  });
  it('includes the available quantity on a stock error', async () => {
    mocks.status = 'authenticated';
    mocks.add.mockRejectedValue(
      new ApiError({
        kind: 'problem',
        status: 409,
        code: 'stock_insufficient',
        availableQuantity: 2,
      }),
    );
    render(<AddToCartButton bookId={1} title="Book" />);
    await userEvent.click(screen.getByRole('button'));
    await waitFor(() =>
      expect(mocks.show).toHaveBeenCalledWith(
        expect.stringContaining('2'),
        expect.objectContaining({ kind: 'error' }),
      ),
    );
  });
  it('shows the confirmation state with an inert resend action', async () => {
    mocks.status = 'authenticated';
    mocks.add.mockRejectedValue(
      new ApiError({ kind: 'problem', status: 403, code: 'email_not_confirmed' }),
    );
    const { container } = render(<AddToCartButton bookId={1} title="Book" />);
    await userEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByText(messages.account.unconfirmed)).toBeVisible());
    expect(container.querySelector('[data-feature="resend-confirmation"]')).toHaveAttribute(
      'inert',
    );
  });
});
