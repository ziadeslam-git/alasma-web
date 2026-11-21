import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { ApiError } from '@/shared/lib/api';
import { axe } from '@/test/axe';

import { ReviewFormModal } from './review-form-modal';

const mocks = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock('@/modules/account', () => ({ UnconfirmedEmailBanner: () => <p>unconfirmed</p> }));
vi.mock('../api/reviews-api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/reviews-api')>()),
  createReview: mocks.create,
}));

const text = messages.reviews;
const star = (count: number) =>
  screen.getByRole('radio', { name: text.starOption.replace('{count}', String(count)) });

describe('ReviewFormModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.create.mockResolvedValue({ id: 1, status: 'Pending' });
  });

  it('shows the stars, the soon title field, the comment and the approval note, with no axe violations', async () => {
    render(<ReviewFormModal bookId={7} onClose={() => undefined} />);

    expect(screen.getAllByRole('radio')).toHaveLength(5);
    expect(screen.getByText(text.pendingNote)).toBeInTheDocument();
    expect(screen.getByLabelText(text.commentLabel)).toBeInTheDocument();
    expect(document.querySelector('[data-feature="review-title"]')).not.toBeNull();
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('asks for a rating and does not call the API without one', async () => {
    render(<ReviewFormModal bookId={7} onClose={() => undefined} />);

    await userEvent.click(screen.getByRole('button', { name: text.submit }));

    expect(await screen.findByText(text.ratingRequired)).toBeInTheDocument();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('rejects a comment over 2000 characters', async () => {
    render(<ReviewFormModal bookId={7} onClose={() => undefined} />);
    await userEvent.click(star(4));
    fireChange(screen.getByLabelText(text.commentLabel), 'ا'.repeat(2001));

    await userEvent.click(screen.getByRole('button', { name: text.submit }));

    expect(
      await screen.findByText(text.commentTooLong.replace('{max}', '2,000')),
    ).toBeInTheDocument();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('submits the rating and the trimmed comment, then shows that the review awaits approval', async () => {
    render(<ReviewFormModal bookId={7} onClose={() => undefined} />);
    await userEvent.click(star(5));
    await userEvent.type(screen.getByLabelText(text.commentLabel), '  كتاب رائع  ');

    await userEvent.click(screen.getByRole('button', { name: text.submit }));

    await waitFor(() =>
      expect(mocks.create).toHaveBeenCalledWith(7, { rating: 5, comment: 'كتاب رائع' }),
    );
    expect(await screen.findByText(text.successText)).toBeInTheDocument();
  });

  it('sends a null comment when the comment is empty', async () => {
    render(<ReviewFormModal bookId={7} onClose={() => undefined} />);
    await userEvent.click(star(3));

    await userEvent.click(screen.getByRole('button', { name: text.submit }));

    await waitFor(() => expect(mocks.create).toHaveBeenCalledWith(7, { rating: 3, comment: null }));
  });

  it('does not submit twice while the request is running', async () => {
    let finish: () => void = () => undefined;
    mocks.create.mockReturnValue(new Promise<void>((resolve) => (finish = resolve)));
    render(<ReviewFormModal bookId={7} onClose={() => undefined} />);
    await userEvent.click(star(2));

    await userEvent.click(screen.getByRole('button', { name: text.submit }));
    const busy = screen.getByRole('button', { name: text.submitting });
    expect(busy).toBeDisabled();
    await userEvent.click(busy);

    expect(mocks.create).toHaveBeenCalledTimes(1);
    finish();
  });

  it.each([
    ['review_already_exists', 409],
    ['review_book_not_found', 404],
    ['review_rating_invalid', 400],
    ['review_unauthenticated', 401],
  ])('shows the Arabic message for %s and keeps the form open', async (code, status) => {
    mocks.create.mockRejectedValue(new ApiError({ kind: 'problem', status, code }));
    render(<ReviewFormModal bookId={7} onClose={() => undefined} />);
    await userEvent.click(star(4));

    await userEvent.click(screen.getByRole('button', { name: text.submit }));

    const key = code as keyof typeof messages.apiErrors.codes;
    expect(await screen.findByRole('alert')).toHaveTextContent(messages.apiErrors.codes[key]);
    expect(screen.queryByText(text.successText)).toBeNull();
  });

  it('shows the confirmation banner for an unconfirmed email and the status text for 429', async () => {
    mocks.create.mockRejectedValueOnce(
      new ApiError({ kind: 'problem', status: 403, code: 'email_not_confirmed' }),
    );
    mocks.create.mockRejectedValueOnce(new ApiError({ kind: 'problem', status: 429 }));
    render(<ReviewFormModal bookId={7} onClose={() => undefined} />);
    await userEvent.click(star(4));

    await userEvent.click(screen.getByRole('button', { name: text.submit }));
    expect(await screen.findByText('unconfirmed')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: text.submit }));
    expect(await screen.findByRole('alert')).toHaveTextContent(messages.apiErrors.status['429']);
  });
});

function fireChange(element: HTMLElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
  setter?.call(element, value);
  element.dispatchEvent(new Event('input', { bubbles: true }));
}
