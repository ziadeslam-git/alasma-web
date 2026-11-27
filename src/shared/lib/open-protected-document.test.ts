import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  openProtectedDocument,
  openSignedUrl,
  PROTECTED_DOCUMENT_REVOKE_MS,
  ProtectedDocumentPopupBlockedError,
  UnsafeSignedUrlError,
} from './open-protected-document';

type FakeTab = { opener: unknown; location: { href: string }; close: ReturnType<typeof vi.fn> };

const SECRET_LINK = 'https://files.example.test/proof?sig=SECRET-SIGNATURE';

function fakeTab(): FakeTab {
  return { opener: window, location: { href: 'about:blank' }, close: vi.fn() };
}

describe('openProtectedDocument', () => {
  const createObjectURL = vi.fn<(blob: Blob) => string>(() => 'blob:doc-1');
  const revokeObjectURL = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL, revokeObjectURL }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('opens the tab before the load, fills it afterwards and revokes the Blob URL after a minute', async () => {
    const tab = fakeTab();
    const open = vi.spyOn(window, 'open').mockReturnValue(tab as unknown as Window);
    let resolveLoad: (html: string) => void = () => undefined;
    const pending = openProtectedDocument(
      () => new Promise<string>((resolve) => (resolveLoad = resolve)),
    );

    expect(open).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledWith('about:blank', '_blank');
    expect(tab.opener).toBeNull();
    expect(tab.location.href).toBe('about:blank');

    resolveLoad('<p>doc</p>');
    await pending;

    expect(tab.location.href).toBe('blob:doc-1');
    vi.advanceTimersByTime(PROTECTED_DOCUMENT_REVOKE_MS - 1);
    expect(revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:doc-1');
  });

  it('accepts a Blob as content', async () => {
    const tab = fakeTab();
    vi.spyOn(window, 'open').mockReturnValue(tab as unknown as Window);
    const blob = new Blob(['x'], { type: 'application/pdf' });

    await openProtectedDocument(() => Promise.resolve(blob));

    expect(createObjectURL).toHaveBeenCalledWith(blob);
  });

  it('throws when the browser blocks the tab, without calling the loader', async () => {
    vi.spyOn(window, 'open').mockReturnValue(null);
    const load = vi.fn();

    await expect(openProtectedDocument(load)).rejects.toBeInstanceOf(
      ProtectedDocumentPopupBlockedError,
    );
    expect(load).not.toHaveBeenCalled();
  });

  it('closes the tab and rethrows when the load fails', async () => {
    const tab = fakeTab();
    vi.spyOn(window, 'open').mockReturnValue(tab as unknown as Window);

    await expect(openProtectedDocument(() => Promise.reject(new Error('boom')))).rejects.toThrow(
      'boom',
    );
    expect(tab.close).toHaveBeenCalled();
    expect(createObjectURL).not.toHaveBeenCalled();
  });
});

describe('openSignedUrl', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('opens the tab at once, then points it at the link without opener', async () => {
    const tab = fakeTab();
    const open = vi.spyOn(window, 'open').mockReturnValue(tab as unknown as Window);
    let resolveLink: (value: { url: string }) => void = () => undefined;
    const pending = openSignedUrl(() => new Promise((resolve) => (resolveLink = resolve)));

    expect(open).toHaveBeenCalledTimes(1);
    expect(tab.opener).toBeNull();
    expect(tab.location.href).toBe('about:blank');

    resolveLink({ url: SECRET_LINK });
    await pending;

    expect(tab.location.href).toBe(SECRET_LINK);
  });

  it('never logs the link and never puts it in storage', async () => {
    const tab = fakeTab();
    vi.spyOn(window, 'open').mockReturnValue(tab as unknown as Window);
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const spies = [
      vi.spyOn(console, 'log'),
      vi.spyOn(console, 'warn'),
      vi.spyOn(console, 'error'),
      vi.spyOn(console, 'info'),
    ];

    await openSignedUrl(() => Promise.resolve({ url: SECRET_LINK }));

    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
  });

  it('refuses a link that is not http(s) and keeps it out of the error', async () => {
    const tab = fakeTab();
    vi.spyOn(window, 'open').mockReturnValue(tab as unknown as Window);

    const failure = await openSignedUrl(() =>
      Promise.resolve({ url: 'javascript:alert(1)' }),
    ).catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(UnsafeSignedUrlError);
    expect((failure as Error).message).not.toContain('javascript');
    expect(tab.close).toHaveBeenCalled();
    expect(tab.location.href).toBe('about:blank');
  });

  it('throws when the tab is blocked and closes it when the request fails', async () => {
    vi.spyOn(window, 'open').mockReturnValueOnce(null);
    await expect(openSignedUrl(vi.fn())).rejects.toBeInstanceOf(ProtectedDocumentPopupBlockedError);

    const tab = fakeTab();
    vi.spyOn(window, 'open').mockReturnValueOnce(tab as unknown as Window);
    await expect(openSignedUrl(() => Promise.reject(new Error('nope')))).rejects.toThrow('nope');
    expect(tab.close).toHaveBeenCalled();
  });
});
