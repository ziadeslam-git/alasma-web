import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { ApiError } from '@/shared/lib/api';
import { axe } from '@/test/axe';

import { resetWishlist } from '../state/wishlist-store';
import { WishlistHeart } from './wishlist-heart';

const mocks = vi.hoisted(() => ({
  status: 'anonymous',
  push: vi.fn(),
  show: vi.fn(),
  ids: vi.fn(),
  add: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('@/modules/auth', () => ({ useAuth: () => ({ status: mocks.status }) }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock('@/shared/ui/toast', () => ({ useToast: () => ({ show: mocks.show }) }));
vi.mock('../api/wishlist-api', () => ({
  getWishlistIds: mocks.ids,
  addToWishlist: mocks.add,
  removeFromWishlist: mocks.remove,
}));

const label = messages.wishlist.toggle.replace('{title}', 'Book');

describe('WishlistHeart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetWishlist();
    mocks.status = 'anonymous';
    mocks.ids.mockResolvedValue([]);
    mocks.add.mockResolvedValue(undefined);
    mocks.remove.mockResolvedValue(undefined);
    window.history.pushState({}, '', '/books/example?page=2');
  });

  it('sends a visitor to sign in and keeps the return URL, without calling the API', async () => {
    render(<WishlistHeart bookId={1} title="Book" />);

    const heart = screen.getByRole('button', { name: label });
    expect(heart).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(heart);

    expect(mocks.push).toHaveBeenCalledWith(
      `/login?next=${encodeURIComponent('/books/example?page=2')}`,
    );
    expect(mocks.add).not.toHaveBeenCalled();
    expect(mocks.ids).not.toHaveBeenCalled();
  });

  it('paints a saved book as pressed once the ids arrive', async () => {
    mocks.status = 'authenticated';
    mocks.ids.mockResolvedValue([1]);
    render(<WishlistHeart bookId={1} title="Book" />);

    await waitFor(() => expect(screen.getByRole('button', { name: label })).toBeEnabled());
    expect(screen.getByRole('button', { name: label })).toHaveAttribute('aria-pressed', 'true');
  });

  it('adds at once (aria-pressed flips before the request ends) and removes again', async () => {
    mocks.status = 'authenticated';
    let finish: () => void = () => undefined;
    mocks.add.mockReturnValue(new Promise<void>((resolve) => (finish = resolve)));
    render(<WishlistHeart bookId={1} title="Book" />);
    await waitFor(() => expect(screen.getByRole('button', { name: label })).toBeEnabled());

    await userEvent.click(screen.getByRole('button', { name: label }));

    expect(screen.getByRole('button', { name: label })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: label })).toBeDisabled();
    finish();
    await waitFor(() => expect(screen.getByRole('button', { name: label })).toBeEnabled());
    expect(mocks.add).toHaveBeenCalledWith(1);

    await userEvent.click(screen.getByRole('button', { name: label }));
    await waitFor(() => expect(mocks.remove).toHaveBeenCalledWith(1));
    expect(screen.getByRole('button', { name: label })).toHaveAttribute('aria-pressed', 'false');
  });

  it('rolls the heart back and shows the Arabic error when the API refuses', async () => {
    mocks.status = 'authenticated';
    mocks.add.mockRejectedValue(
      new ApiError({ kind: 'problem', status: 422, code: 'wishlist_limit_reached' }),
    );
    render(<WishlistHeart bookId={1} title="Book" />);
    await waitFor(() => expect(screen.getByRole('button', { name: label })).toBeEnabled());

    await userEvent.click(screen.getByRole('button', { name: label }));

    await waitFor(() =>
      expect(mocks.show).toHaveBeenCalledWith(
        messages.apiErrors.codes.wishlist_limit_reached,
        expect.objectContaining({ kind: 'error' }),
      ),
    );
    expect(screen.getByRole('button', { name: label })).toHaveAttribute('aria-pressed', 'false');
  });

  it('rolls a removal back and uses the generic text for a non-API failure', async () => {
    mocks.status = 'authenticated';
    mocks.ids.mockResolvedValue([1]);
    mocks.remove.mockRejectedValue(new Error('offline'));
    render(<WishlistHeart bookId={1} title="Book" />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: label })).toHaveAttribute('aria-pressed', 'true'),
    );

    await userEvent.click(screen.getByRole('button', { name: label }));

    await waitFor(() =>
      expect(mocks.show).toHaveBeenCalledWith(
        messages.wishlist.toggleError,
        expect.objectContaining({ kind: 'error' }),
      ),
    );
    expect(screen.getByRole('button', { name: label })).toHaveAttribute('aria-pressed', 'true');
  });

  it('waits (disabled) while the session or the ids are loading, and has no axe violations', async () => {
    mocks.status = 'loading';
    const { container } = render(<WishlistHeart bookId={1} title="Book" />);

    expect(screen.getByRole('button', { name: label })).toBeDisabled();
    expect(await axe(container)).toHaveNoViolations();
  });
});
