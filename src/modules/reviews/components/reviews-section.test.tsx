import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { FeatureFlagsProvider, resolveFeatureFlags } from '@/shared/config/feature-flags';
import { ApiError } from '@/shared/lib/api';
import { axe } from '@/test/axe';

import type { PublicReview, ReviewsPage } from '../api/reviews-api';
import { BookReviews } from './book-reviews';

const mocks = vi.hoisted(() => ({
  status: 'anonymous',
  push: vi.fn(),
  first: vi.fn(),
  more: vi.fn(),
}));

vi.mock('@/modules/auth', () => ({ useAuth: () => ({ status: mocks.status }) }));
vi.mock('@/modules/account', () => ({ UnconfirmedEmailBanner: () => <p>unconfirmed</p> }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock('../api/reviews-api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/reviews-api')>()),
  getBookReviews: mocks.first,
  loadMoreReviews: mocks.more,
  createReview: vi.fn(),
}));

const text = messages.reviews;
const review = (name: string, comment: string | null = 'نص التقييم'): PublicReview => ({
  displayName: name,
  rating: 4,
  comment,
  createdAt: '2026-11-20T10:00:00Z',
});
const pageOf = (items: PublicReview[], hasNextPage = false, page = 1): ReviewsPage => ({
  items,
  page,
  pageSize: 48,
  totalCount: items.length,
  totalPages: hasNextPage ? 2 : 1,
  hasNextPage,
  hasPreviousPage: page > 1,
});

async function renderSection(props: Partial<Parameters<typeof BookReviews>[0]> = {}) {
  const ui = await BookReviews({
    bookId: 7,
    ratingAverage: 4.8,
    ratingCount: 2400,
    slug: 'book-7',
    ...props,
  });
  return render(ui);
}

describe('BookReviews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.status = 'anonymous';
  });

  it('shows the API average, count and the approved reviews as plain text', async () => {
    mocks.first.mockResolvedValue({
      status: 'ok',
      page: pageOf([review('سارة', '<b>نص</b> مع سطر\nثانٍ'), review('دينا')]),
    });
    const { container } = await renderSection();

    expect(screen.getByRole('heading', { name: text.title })).toBeInTheDocument();
    expect(screen.getByText('4.8')).toBeInTheDocument();
    expect(screen.getByText(text.basedOn.replace('{count}', '2,400'))).toBeInTheDocument();
    expect(screen.getByText('سارة')).toBeInTheDocument();
    expect(screen.getByText('<b>نص</b> مع سطر ثانٍ', { exact: false })).toBeInTheDocument();
    expect(container.querySelector('p b')).toBeNull();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getAllByText('20 نوفمبر 2026', { exact: false })).not.toHaveLength(0);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows the empty state, and no summary figures when the book has no ratings', async () => {
    mocks.first.mockResolvedValue({ status: 'ok', page: pageOf([]) });
    const { container } = await renderSection({ ratingAverage: null, ratingCount: 0 });

    expect(screen.getByText(text.emptyTitle)).toBeInTheDocument();
    expect(screen.queryByText(text.basedOn.replace('{count}', '0'))).toBeNull();
    expect(screen.getByRole('button', { name: text.writeButton })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows an error line when the list cannot be read, but keeps the write button', async () => {
    mocks.first.mockResolvedValue({ status: 'error' });
    await renderSection();

    expect(screen.getByRole('alert')).toHaveTextContent(text.loadError);
    expect(screen.getByRole('button', { name: text.writeButton })).toBeInTheDocument();
  });

  it('pages with "show more" and keeps the first reviews', async () => {
    mocks.first.mockResolvedValue({ status: 'ok', page: pageOf([review('سارة')], true) });
    mocks.more.mockResolvedValue(pageOf([review('منى')], false, 2));
    await renderSection();

    await userEvent.click(screen.getByRole('button', { name: text.loadMore }));

    await waitFor(() => expect(screen.getByText('منى')).toBeInTheDocument());
    expect(mocks.more).toHaveBeenCalledWith('book-7', 2);
    expect(screen.getByText('سارة')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: text.loadMore })).toBeNull();
  });

  it('shows the Arabic error when "show more" fails and lets the reader try again', async () => {
    mocks.first.mockResolvedValue({ status: 'ok', page: pageOf([review('سارة')], true) });
    mocks.more.mockRejectedValue(new ApiError({ kind: 'network' }));
    await renderSection();

    await userEvent.click(screen.getByRole('button', { name: text.loadMore }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: text.loadMore })).toBeEnabled();
  });

  it('sends a visitor to sign in with the return URL and does not open the form', async () => {
    mocks.first.mockResolvedValue({ status: 'ok', page: pageOf([]) });
    window.history.pushState({}, '', '/books/book-7');
    await renderSection();

    await userEvent.click(screen.getByRole('button', { name: text.writeButton }));

    expect(mocks.push).toHaveBeenCalledWith(
      `/login?next=${encodeURIComponent('/books/book-7#reviews')}`,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens the review dialog for a signed-in customer', async () => {
    mocks.status = 'authenticated';
    mocks.first.mockResolvedValue({ status: 'ok', page: pageOf([]) });
    await renderSection();

    await userEvent.click(screen.getByRole('button', { name: text.writeButton }));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(text.pendingNote)).toBeInTheDocument();
  });

  it('renders nothing while the reviews feature is soon', async () => {
    mocks.first.mockResolvedValue({ status: 'ok', page: pageOf([review('سارة')]) });
    const ui = await BookReviews({ bookId: 7, ratingAverage: 4, ratingCount: 1, slug: 's' });
    render(
      <FeatureFlagsProvider value={{ ...resolveFeatureFlags(null), 'reviews-section': 'soon' }}>
        {ui}
      </FeatureFlagsProvider>,
    );

    expect(screen.queryByRole('heading', { name: text.title })).toBeNull();
  });
});
