import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { ApiError } from '@/shared/lib/api';
import { axe } from '@/test/axe';

import { ImageUploader, UPLOAD_TIMEOUT_MS, type ImageUploadContext } from './image-uploader';
import { IMAGE_MAX_BYTES } from './image-validation';

const copy = messages.admin.uploader;
const LABEL = 'صورة الغلاف';
const createObjectURL = vi.fn<(blob: Blob) => string>();
const revokeObjectURL = vi.fn();
let counter = 0;

function makeFile(type = 'image/png', size = 1024, name = 'cover.png'): File {
  const file = new File(['x'], name, { type });

  Object.defineProperty(file, 'size', { value: size });

  return file;
}

function renderUploader(onUpload = vi.fn().mockResolvedValue(undefined), isDisabled = false) {
  const view = render(<ImageUploader isDisabled={isDisabled} label={LABEL} onUpload={onUpload} />);
  const input = view.container.querySelector<HTMLInputElement>('input[type="file"]');

  if (!input) throw new Error('no file input');

  return { ...view, input, onUpload };
}

function pick(input: HTMLInputElement, file: File) {
  fireEvent.change(input, { target: { files: [file] } });
}

describe('ImageUploader', () => {
  beforeEach(() => {
    counter = 0;
    createObjectURL.mockReset().mockImplementation(() => `blob:preview-${++counter}`);
    revokeObjectURL.mockReset();
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL, revokeObjectURL }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('starts empty with the upload button disabled and passes axe', async () => {
    const { container } = renderUploader();

    expect(screen.getByText(copy.empty)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: copy.upload })).toBeDisabled();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows a local preview for a valid file and sends nothing yet', () => {
    const { input, onUpload } = renderUploader();

    pick(input, makeFile());

    expect(screen.getByAltText(copy.previewAlt)).toHaveAttribute('src', 'blob:preview-1');
    expect(screen.getByRole('button', { name: copy.upload })).toBeEnabled();
    expect(onUpload).not.toHaveBeenCalled();
  });

  it('rejects a file that is too big before any upload', () => {
    const { input, onUpload } = renderUploader();

    pick(input, makeFile('image/png', IMAGE_MAX_BYTES + 1));

    expect(screen.getByRole('alert')).toHaveTextContent(copy.sizeError);
    expect(screen.getByRole('button', { name: copy.upload })).toBeDisabled();
    expect(createObjectURL).not.toHaveBeenCalled();
    expect(onUpload).not.toHaveBeenCalled();
  });

  it('rejects a wrong type and an empty file', () => {
    const { input } = renderUploader();

    pick(input, makeFile('application/pdf', 100, 'a.pdf'));
    expect(screen.getByRole('alert')).toHaveTextContent(copy.typeError);

    pick(input, makeFile('image/png', 0));
    expect(screen.getByRole('alert')).toHaveTextContent(copy.emptyError);
  });

  it('shows progress while uploading, disables the controls and finishes', async () => {
    let context: ImageUploadContext | null = null;
    let finish: () => void = () => undefined;
    const onUpload = vi.fn((_file: File, ctx: ImageUploadContext) => {
      context = ctx;

      return new Promise<void>((resolve) => (finish = resolve));
    });
    const { input } = renderUploader(onUpload);

    pick(input, makeFile());
    fireEvent.click(screen.getByRole('button', { name: copy.upload }));

    await waitFor(() => expect(screen.getByRole('progressbar')).toBeInTheDocument());
    expect(input).toBeDisabled();
    expect(screen.getByRole('button', { name: copy.replace })).toBeDisabled();

    act(() => context?.onProgress(40));
    expect(screen.getByRole('progressbar')).toHaveValue(40);
    expect(screen.getByText('40%')).toBeInTheDocument();

    await act(async () => finish());
    expect(await screen.findByRole('status')).toHaveTextContent(copy.done);
  });

  it('cancels the upload: the signal is aborted and no error is shown', async () => {
    let signal: AbortSignal | null = null;
    const onUpload = vi.fn(
      (_file: File, ctx: ImageUploadContext) =>
        new Promise<void>((_resolve, reject) => {
          signal = ctx.signal;
          ctx.signal.addEventListener('abort', () => reject(new DOMException('x', 'AbortError')));
        }),
    );
    const { input } = renderUploader(onUpload);

    pick(input, makeFile());
    fireEvent.click(screen.getByRole('button', { name: copy.upload }));
    fireEvent.click(await screen.findByRole('button', { name: copy.cancel }));

    await waitFor(() => expect(screen.getByRole('button', { name: copy.upload })).toBeEnabled());
    expect((signal as AbortSignal | null)?.aborted).toBe(true);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('gives up after 60 seconds with a timeout message', async () => {
    vi.useFakeTimers();
    const onUpload = vi.fn(
      (_file: File, ctx: ImageUploadContext) =>
        new Promise<void>((_resolve, reject) => {
          ctx.signal.addEventListener('abort', () => reject(new DOMException('x', 'AbortError')));
        }),
    );
    const { input } = renderUploader(onUpload);

    pick(input, makeFile());
    fireEvent.click(screen.getByRole('button', { name: copy.upload }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(UPLOAD_TIMEOUT_MS);
    });

    expect(screen.getByRole('alert')).toHaveTextContent(copy.timeout);
  });

  it('maps 429 to a message with the Retry-After seconds', async () => {
    const onUpload = vi
      .fn()
      .mockRejectedValue(new ApiError({ kind: 'problem', status: 429, retryAfterSeconds: 30 }));
    const { input } = renderUploader(onUpload);

    pick(input, makeFile());
    fireEvent.click(screen.getByRole('button', { name: copy.upload }));

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent(messages.apiErrors.admin.kinds.rate_limited);
    expect(alert).toHaveTextContent(copy.retryAfter.replace('{seconds}', '30'));
  });

  it('maps 400 payment_proof_file_invalid through the central mapper', async () => {
    const onUpload = vi
      .fn()
      .mockRejectedValue(
        new ApiError({ kind: 'problem', status: 400, code: 'payment_proof_file_invalid' }),
      );
    const { input } = renderUploader(onUpload);

    pick(input, makeFile());
    fireEvent.click(screen.getByRole('button', { name: copy.upload }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      messages.apiErrors.codes.payment_proof_file_invalid,
    );
  });

  it('is fully disabled when asked to be', () => {
    const { input } = renderUploader(undefined, true);

    expect(input).toBeDisabled();
    expect(screen.getByRole('button', { name: copy.pick })).toBeDisabled();
  });

  it('revokes the preview when the file changes and on unmount', () => {
    const { input, unmount } = renderUploader();

    pick(input, makeFile());
    pick(input, makeFile('image/jpeg', 2048, 'b.jpg'));
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview-1');

    unmount();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview-2');
  });
});
