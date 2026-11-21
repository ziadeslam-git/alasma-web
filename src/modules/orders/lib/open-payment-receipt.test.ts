import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/shared/lib/api';

const getHtml = vi.hoisted(() => vi.fn());
vi.mock('../api/payment-receipt-api', () => ({ getPaymentReceiptHtml: getHtml }));
import {
  openPaymentReceipt,
  ReceiptPopupBlockedError,
  RECEIPT_URL_REVOKE_MS,
} from './open-payment-receipt';

type FakeTab = { opener: unknown; location: { href: string }; close: ReturnType<typeof vi.fn> };

function fakeTab(): FakeTab {
  return { opener: window, location: { href: 'about:blank' }, close: vi.fn() };
}

describe('openPaymentReceipt', () => {
  const createObjectURL = vi.fn<(blob: Blob) => string>(() => 'blob:receipt-1');
  const revokeObjectURL = vi.fn();
  let blobs: Blob[];
  let blobParts: unknown[];

  // jsdom's Blob cannot be read back, so the parts given to the constructor are recorded.
  class RecordingBlob extends Blob {
    constructor(parts?: BlobPart[], options?: BlobPropertyBag) {
      super(parts, options);
      blobParts.push(parts);
    }
  }

  beforeEach(() => {
    vi.useFakeTimers();
    blobs = [];
    blobParts = [];
    vi.stubGlobal('Blob', RecordingBlob);
    createObjectURL.mockClear().mockImplementation((blob: Blob) => {
      blobs.push(blob);
      return 'blob:receipt-1';
    });
    revokeObjectURL.mockClear();
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL, revokeObjectURL }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    getHtml.mockReset();
  });

  it('opens the tab before the fetch, hides the opener, shows the page from a Blob URL and revokes it later', async () => {
    const tab = fakeTab();
    const open = vi.spyOn(window, 'open').mockReturnValue(tab as unknown as Window);
    let resolveHtml: (html: string) => void = () => undefined;
    getHtml.mockImplementation(() => new Promise<string>((resolve) => (resolveHtml = resolve)));

    const pending = openPaymentReceipt('order-1', 'payment-1');

    // Synchronous with the click: the tab exists while the fetch is still running.
    expect(open).toHaveBeenCalledTimes(1);
    expect(tab.opener).toBeNull();
    expect(getHtml).toHaveBeenCalledWith('order-1', 'payment-1');
    expect(tab.location.href).toBe('about:blank');

    resolveHtml('<html>receipt</html>');
    await pending;

    expect(tab.location.href).toBe('blob:receipt-1');
    expect(blobs).toHaveLength(1);
    expect(blobs[0]?.type).toBe('text/html;charset=utf-8');
    expect(blobParts).toEqual([['<html>receipt</html>']]);
    expect(revokeObjectURL).not.toHaveBeenCalled();

    vi.advanceTimersByTime(RECEIPT_URL_REVOKE_MS - 1);
    expect(revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(revokeObjectURL).toHaveBeenCalledExactlyOnceWith('blob:receipt-1');
  });

  it('puts no token and no order data in the tab URL', async () => {
    const tab = fakeTab();
    vi.spyOn(window, 'open').mockReturnValue(tab as unknown as Window);
    getHtml.mockResolvedValue('<html></html>');

    await openPaymentReceipt('order-1', 'payment-1');

    expect(tab.location.href).not.toMatch(/token|order-1|payment-1/);
  });

  it('closes the blank tab and rethrows when the receipt cannot be fetched', async () => {
    const tab = fakeTab();
    vi.spyOn(window, 'open').mockReturnValue(tab as unknown as Window);
    const failure = new ApiError({ kind: 'problem', status: 422 });
    getHtml.mockRejectedValue(failure);

    await expect(openPaymentReceipt('order-1', 'payment-1')).rejects.toBe(failure);

    expect(tab.close).toHaveBeenCalledTimes(1);
    expect(createObjectURL).not.toHaveBeenCalled();
    expect(revokeObjectURL).not.toHaveBeenCalled();
  });

  it('reports a blocked tab without fetching anything', async () => {
    vi.spyOn(window, 'open').mockReturnValue(null);

    await expect(openPaymentReceipt('order-1', 'payment-1')).rejects.toBeInstanceOf(
      ReceiptPopupBlockedError,
    );

    expect(getHtml).not.toHaveBeenCalled();
  });
});
