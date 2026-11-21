import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import messages from '@/i18n/messages/ar.json';
import { ApiError } from '@/shared/lib/api';
import { axe } from '@/test/axe';
import { buildOrder } from '@/test/fixtures/orders';

const submitProof = vi.hoisted(() => vi.fn());
vi.mock('../api/payment-proof-api', () => ({ submitPaymentProof: submitProof }));
vi.mock('@/modules/account', () => ({ UnconfirmedEmailBanner: () => <p>Confirm email</p> }));
import { PaymentProofForm } from './payment-proof-form';

const text = messages.orders;
const order = buildOrder();
const codes = messages.apiErrors.codes;

function pick(type = 'image/png', size = 10, name = 'receipt.png'): File {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

function setup() {
  const onSubmitted = vi.fn();
  const user = userEvent.setup({ applyAccept: false });
  const view = render(<PaymentProofForm order={order} onSubmitted={onSubmitted} />);
  const fileInput = () => screen.getByLabelText(text.proofFile) as HTMLInputElement;
  const submit = () => screen.getByRole('button', { name: text.proofSubmit });
  return { ...view, user, onSubmitted, fileInput, submit };
}

describe('PaymentProofForm', () => {
  const createObjectURL = vi.fn();
  const revokeObjectURL = vi.fn();
  let counter = 0;

  beforeEach(() => {
    counter = 0;
    submitProof.mockReset();
    createObjectURL.mockReset().mockImplementation(() => `blob:preview-${++counter}`);
    revokeObjectURL.mockReset();
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL, revokeObjectURL }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders labelled fields and has no accessibility violations', async () => {
    const { container } = setup();

    expect(screen.getByRole('heading', { name: text.proofTitle })).toBeInTheDocument();
    expect(screen.getByLabelText(text.proofFile)).toHaveAttribute(
      'accept',
      'image/jpeg,image/png,image/webp',
    );
    expect(screen.getByLabelText(text.proofReference)).toBeInTheDocument();
    expect(screen.getByLabelText(text.proofPhone)).toHaveAttribute('inputmode', 'tel');
    expect(screen.getByText(text.proofFileHint)).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('asks for a file before sending anything', async () => {
    const { user, submit } = setup();

    await user.click(submit());

    expect(screen.getByRole('alert')).toHaveTextContent(text.proofFileRequired);
    expect(submitProof).not.toHaveBeenCalled();
  });

  it('rejects a PDF before sending, without a preview', async () => {
    const { user, fileInput, submit, container } = setup();

    await user.upload(fileInput(), pick('application/pdf', 10, 'receipt.pdf'));

    expect(screen.getByRole('alert')).toHaveTextContent(text.proofFileType);
    expect(screen.queryByRole('img')).toBeNull();
    expect(createObjectURL).not.toHaveBeenCalled();
    await user.click(submit());
    expect(submitProof).not.toHaveBeenCalled();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('rejects an image over 5 MB and accepts exactly 5 MB', async () => {
    const { user, fileInput, submit } = setup();

    await user.upload(fileInput(), pick('image/png', 5_242_881));
    expect(screen.getByRole('alert')).toHaveTextContent(text.proofFileSize);
    await user.click(submit());
    expect(submitProof).not.toHaveBeenCalled();

    await user.upload(fileInput(), pick('image/png', 5_242_880));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it.each([
    ['01012345678', null],
    ['12345', text.proofPhoneInvalid],
  ])('validates the sender phone "%s"', async (phone, expected) => {
    submitProof.mockResolvedValue(order);
    const { user, fileInput, submit } = setup();
    await user.upload(fileInput(), pick());
    await user.type(screen.getByLabelText(text.proofPhone), phone);

    await user.click(submit());

    if (expected) {
      expect(screen.getByRole('alert')).toHaveTextContent(expected);
      expect(submitProof).not.toHaveBeenCalled();
    } else {
      await waitFor(() => expect(submitProof).toHaveBeenCalledTimes(1));
    }
  });

  it('rejects a transaction reference over 100 characters', async () => {
    const { user, fileInput, submit } = setup();
    await user.upload(fileInput(), pick());
    await user.click(screen.getByLabelText(text.proofReference));
    await user.paste('a'.repeat(101));

    await user.click(submit());

    expect(screen.getByRole('alert')).toHaveTextContent(text.proofReferenceTooLong);
    expect(submitProof).not.toHaveBeenCalled();
  });

  it('shows a local preview of the chosen image and releases it when the file changes and on unmount', async () => {
    const { user, fileInput, unmount } = setup();

    await user.upload(fileInput(), pick('image/png'));
    expect(screen.getByAltText(text.proofPreviewAlt)).toHaveAttribute('src', 'blob:preview-1');
    expect(revokeObjectURL).not.toHaveBeenCalled();

    await user.upload(fileInput(), pick('image/webp', 10, 'second.webp'));
    expect(screen.getByAltText(text.proofPreviewAlt)).toHaveAttribute('src', 'blob:preview-2');
    expect(revokeObjectURL).toHaveBeenCalledExactlyOnceWith('blob:preview-1');

    unmount();
    expect(revokeObjectURL).toHaveBeenLastCalledWith('blob:preview-2');
    expect(revokeObjectURL).toHaveBeenCalledTimes(2);
  });

  it('sends the file with its optional fields and hands the new order to the parent', async () => {
    const updated = buildOrder({ status: 'PaymentReview' });
    submitProof.mockResolvedValue(updated);
    const { user, fileInput, submit, onSubmitted } = setup();
    const file = pick();
    await user.upload(fileInput(), file);
    await user.type(screen.getByLabelText(text.proofReference), 'REF-77');
    await user.type(screen.getByLabelText(text.proofPhone), '01012345678');

    await user.click(submit());

    await waitFor(() => expect(onSubmitted).toHaveBeenCalledExactlyOnceWith(updated));
    expect(submitProof).toHaveBeenCalledExactlyOnceWith(order.id, {
      file,
      transactionReference: 'REF-77',
      senderPhone: '01012345678',
    });
    expect(JSON.stringify(submitProof.mock.calls)).not.toMatch(/amount/i);
  });

  it('disables the form and ignores a second click while uploading', async () => {
    let finish: (value: unknown) => void = () => undefined;
    submitProof.mockImplementation(() => new Promise((resolve) => (finish = resolve)));
    const { user, fileInput, onSubmitted } = setup();
    await user.upload(fileInput(), pick());

    await user.click(screen.getByRole('button', { name: text.proofSubmit }));

    const busy = screen.getByRole('button', { name: text.proofUploading });
    expect(busy).toBeDisabled();
    expect(busy).toHaveAttribute('aria-busy', 'true');
    expect(fileInput()).toBeDisabled();
    expect(screen.getByLabelText(text.proofReference)).toBeDisabled();
    expect(screen.getByLabelText(text.proofPhone)).toBeDisabled();
    await user.click(busy);
    expect(submitProof).toHaveBeenCalledTimes(1);

    finish(buildOrder({ status: 'PaymentReview' }));
    await waitFor(() => expect(onSubmitted).toHaveBeenCalledTimes(1));
  });

  it.each([
    [400, 'payment_proof_file_invalid'],
    [409, 'payment_reference_taken'],
    [422, 'payment_proof_not_allowed'],
    [422, 'payment_proof_order_expired'],
    [422, 'payment_proof_already_submitted'],
  ] as const)(
    'shows the Arabic text of HTTP %i %s and keeps the form usable',
    async (status, code) => {
      submitProof.mockRejectedValue(new ApiError({ kind: 'problem', status, code }));
      const { user, fileInput, submit, onSubmitted } = setup();
      await user.upload(fileInput(), pick());

      await user.click(submit());

      expect(await screen.findByRole('alert')).toHaveTextContent(codes[code]);
      expect(onSubmitted).not.toHaveBeenCalled();
      expect(submit()).toBeEnabled();
      expect(fileInput()).toBeEnabled();
    },
  );

  it('shows the order-not-found text for a 404', async () => {
    submitProof.mockRejectedValue(
      new ApiError({ kind: 'problem', status: 404, code: 'order_not_found' }),
    );
    const { user, fileInput, submit } = setup();
    await user.upload(fileInput(), pick());

    await user.click(submit());

    expect(await screen.findByRole('alert')).toHaveTextContent(codes.order_not_found);
  });

  it('shows the file-too-large text for a 413 without a code', async () => {
    submitProof.mockRejectedValue(new ApiError({ kind: 'problem', status: 413 }));
    const { user, fileInput, submit } = setup();
    await user.upload(fileInput(), pick());

    await user.click(submit());

    expect(await screen.findByRole('alert')).toHaveTextContent(messages.apiErrors.status['413']);
  });

  it('shows the wait time of a 429', async () => {
    submitProof.mockRejectedValue(
      new ApiError({ kind: 'problem', status: 429, retryAfterSeconds: 12 }),
    );
    const { user, fileInput, submit } = setup();
    await user.upload(fileInput(), pick());

    await user.click(submit());

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(messages.apiErrors.status['429']);
    expect(alert).toHaveTextContent(text.retryAfter.replace('{seconds}', '12'));
  });

  it('shows the generic text for a network failure and the banner for an unconfirmed email', async () => {
    submitProof.mockRejectedValueOnce(new ApiError({ kind: 'network' }));
    submitProof.mockRejectedValueOnce(
      new ApiError({ kind: 'problem', status: 403, code: 'email_not_confirmed' }),
    );
    const { user, fileInput, submit, container } = setup();
    await user.upload(fileInput(), pick());

    await user.click(submit());
    expect(await screen.findByRole('alert')).toHaveTextContent(messages.apiErrors.kind.network);

    await user.click(submit());
    expect(await screen.findByText('Confirm email')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('keeps the error inside the form region', async () => {
    submitProof.mockRejectedValue(
      new ApiError({ kind: 'problem', status: 409, code: 'payment_reference_taken' }),
    );
    const { user, fileInput, submit } = setup();
    await user.upload(fileInput(), pick());

    await user.click(submit());

    const form = screen.getByRole('form', { name: text.proofTitle });
    expect(await within(form).findByRole('alert')).toBeInTheDocument();
  });
});
