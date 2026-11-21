import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { ApiError } from '@/shared/lib/api';
import { axe } from '@/test/axe';

import type { WishlistItem, WishlistPage } from '../api/wishlist-api';
import { resetWishlist } from '../state/wishlist-store';
import { WishlistView } from './wishlist-view';

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  show: vi.fn(),
  list: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace, push: vi.fn() }),
}));
vi.mock('@/shared/ui/toast', () => ({ useToast: () => ({ show: mocks.show }) }));
vi.mock('@/modules/account', () => ({ UnconfirmedEmailBanner: () => <p>unconfirmed</p> }));
vi.mock('@/modules/catalog', () => ({
  BookCard: ({ book, removeSlot }: { book: WishlistItem; removeSlot?: React.ReactNode }) => (
    <article aria-label={book.title}>
      {removeSlot}
      <h3>{book.title}</h3>
    </article>
  ),
}));
vi.mock('../api/wishlist-api', () => ({
  getWishlist: mocks.list,
  addToWishlist: vi.fn(),
  removeFromWishlist: mocks.remove,
  getWishlistIds: vi.fn(),
}));

const book = (id: number): WishlistItem => ({
  id,
  slug: `book-${id}`,
  title: `Book ${id}`,
  coverImageUrl: null,
  authors: ['Author'],
  price: 100,
  finalPrice: 100,
  discountPercent: 0,
  stockStatus: 'InStock',
  isNew: false,
  isFeatured: false,
  addedAt: '2026-11-20T10:00:00Z',
});

const pageOf = (items: WishlistItem[], overrides: Partial<WishlistPage> = {}): WishlistPage => ({
  items,
  page: 1,
  pageSize: 48,
  totalCount: items.length,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
  ...overrides,
});

const removeLabel = (id: number) => messages.wishlist.remove.replace('{title}', `Book ${id}`);

describe('WishlistView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetWishlist();
    mocks.remove.mockResolvedValue(undefined);
  });

  it('shows the loaded books, the count and the store link', async () => {
    mocks.list.mockResolvedValue(pageOf([book(1), book(2)]));
    const { container } = render(<WishlistView />);

    expect(await screen.findByRole('heading', { name: 'Book 1' })).toBeInTheDocument();
    const list = screen.getByRole('list', { name: messages.wishlist.listLabel });
    expect(within(list).getAllByRole('article')).toHaveLength(2);
    expect(screen.getByText(messages.wishlist.count.replace('{count}', '2'))).toBeInTheDocument();
    expect(screen.getByRole('link', { name: messages.wishlist.browseAction })).toHaveAttribute(
      'href',
      '/books',
    );
    expect(mocks.list).toHaveBeenCalledWith(1);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows the empty state with a link to the store', async () => {
    mocks.list.mockResolvedValue(pageOf([]));
    const { container } = render(<WishlistView />);

    expect(
      await screen.findByRole('heading', { name: messages.wishlist.emptyTitle }),
    ).toBeInTheDocument();
    expect(screen.getByText(messages.wishlist.emptyDescription)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: messages.wishlist.emptyAction })).toHaveAttribute(
      'href',
      '/books',
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows an error with a retry that reads the list again', async () => {
    mocks.list.mockRejectedValueOnce(new ApiError({ kind: 'network' }));
    mocks.list.mockResolvedValueOnce(pageOf([book(1)]));
    render(<WishlistView />);

    expect(await screen.findByRole('alert')).toHaveTextContent(messages.wishlist.loadError);
    await userEvent.click(screen.getByRole('button', { name: messages.wishlist.retry }));

    expect(await screen.findByRole('heading', { name: 'Book 1' })).toBeInTheDocument();
    expect(mocks.list).toHaveBeenCalledTimes(2);
  });

  it('removes a book at once and keeps it removed after the API answers', async () => {
    mocks.list.mockResolvedValue(pageOf([book(1), book(2)]));
    render(<WishlistView />);
    await screen.findByRole('heading', { name: 'Book 1' });

    await userEvent.click(screen.getByRole('button', { name: removeLabel(1) }));

    await waitFor(() => expect(mocks.remove).toHaveBeenCalledWith(1));
    expect(screen.queryByRole('heading', { name: 'Book 1' })).toBeNull();
    expect(screen.getByText(messages.wishlist.count.replace('{count}', '1'))).toBeInTheDocument();
  });

  it('puts the book back and shows the Arabic error when the removal fails', async () => {
    mocks.list.mockResolvedValue(pageOf([book(1)]));
    mocks.remove.mockRejectedValue(new ApiError({ kind: 'problem', status: 429 }));
    render(<WishlistView />);
    await screen.findByRole('heading', { name: 'Book 1' });

    await userEvent.click(screen.getByRole('button', { name: removeLabel(1) }));

    await waitFor(() =>
      expect(mocks.show).toHaveBeenCalledWith(
        messages.apiErrors.status['429'],
        expect.objectContaining({ kind: 'error' }),
      ),
    );
    expect(screen.getByRole('heading', { name: 'Book 1' })).toBeInTheDocument();
  });

  it('goes to the previous page when the last book of a later page is removed', async () => {
    mocks.list.mockResolvedValue(
      pageOf([book(49)], { page: 2, totalCount: 49, totalPages: 2, hasPreviousPage: true }),
    );
    render(<WishlistView page={2} />);
    await screen.findByRole('heading', { name: 'Book 49' });

    await userEvent.click(screen.getByRole('button', { name: removeLabel(49) }));

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/account/wishlist'));
  });

  it('pages with ?page= links when the list is longer than one page', async () => {
    mocks.list.mockResolvedValue(
      pageOf([book(1)], { totalCount: 60, totalPages: 2, hasNextPage: true }),
    );
    render(<WishlistView />);
    await screen.findByRole('heading', { name: 'Book 1' });

    const next = screen.getByRole('link', { name: messages.catalog.page.pagination.next });
    expect(next).toHaveAttribute('href', '/account/wishlist?page=2');
  });

  it('renders a fixture without calling the API', () => {
    render(<WishlistView fixture={pageOf([book(1)])} />);

    expect(screen.getByRole('heading', { name: 'Book 1' })).toBeInTheDocument();
    expect(mocks.list).not.toHaveBeenCalled();
  });
});
