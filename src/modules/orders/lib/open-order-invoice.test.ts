import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/shared/lib/api';

const getHtml = vi.hoisted(() => vi.fn());
vi.mock('../api/order-invoice-api', () => ({ getOrderInvoiceHtml: getHtml }));
import { openOrderInvoice } from './open-order-invoice';
import { PRINTABLE_URL_REVOKE_MS, PrintablePopupBlockedError } from './open-printable-page';

type FakeTab = { opener: unknown; location: { href: string }; close: ReturnType<typeof vi.fn> };

function fakeTab(): FakeTab {
  return { opener: window, location: { href: 'about:blank' }, close: vi.fn() };
}

describe('openOrderInvoice', () => {
  const createObjectURL = vi.fn<(blob: Blob) => string>(() => 'blob:invoice-1');
  const revokeObjectURL = vi.fn();
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
    blobParts = [];
    vi.stubGlobal('Blob', RecordingBlob);
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL, revokeObjectURL }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    getHtml.mockReset();
  });

  it('opens the tab before the fetch, shows the invoice from a Blob URL and revokes it later', async () => {
    const tab = fakeTab();
    const open = vi.spyOn(window, 'open').mockReturnValue(tab as unknown as Window);
    let resolveHtml: (html: string) => void = () => undefined;
    getHtml.mockImplementation(() => new Promise<string>((resolve) => (resolveHtml = resolve)));

    const pending = openOrderInvoice('order-1');

    expect(open).toHaveBeenCalledTimes(1);
    expect(tab.opener).toBeNull();
    expect(getHtml).toHaveBeenCalledWith('order-1');
    expect(tab.location.href).toBe('about:blank');

    resolveHtml('<html>invoice</html>');
    await pending;

    expect(tab.location.href).toBe('blob:invoice-1');
    expect(tab.location.href).not.toMatch(/token|order-1/);
    expect(blobParts).toEqual([['<html>invoice</html>']]);
    expect(createObjectURL.mock.calls[0]?.[0].type).toBe('text/html;charset=utf-8');
    vi.advanceTimersByTime(PRINTABLE_URL_REVOKE_MS - 1);
    expect(revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(revokeObjectURL).toHaveBeenCalledExactlyOnceWith('blob:invoice-1');
  });

  it('closes the blank tab and rethrows when the invoice cannot be fetched', async () => {
    const tab = fakeTab();
    vi.spyOn(window, 'open').mockReturnValue(tab as unknown as Window);
    const failure = new ApiError({ kind: 'problem', status: 422, code: 'invoice_not_available' });
    getHtml.mockRejectedValue(failure);

    await expect(openOrderInvoice('order-1')).rejects.toBe(failure);

    expect(tab.close).toHaveBeenCalledTimes(1);
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it('reports a blocked tab without fetching anything', async () => {
    vi.spyOn(window, 'open').mockReturnValue(null);

    await expect(openOrderInvoice('order-1')).rejects.toBeInstanceOf(PrintablePopupBlockedError);

    expect(getHtml).not.toHaveBeenCalled();
  });
});
