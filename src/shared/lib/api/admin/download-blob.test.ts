import { afterEach, describe, expect, it, vi } from 'vitest';

import { downloadBlob } from './download-blob';

describe('downloadBlob', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('clicks a temporary link with the file name, then revokes the object URL and removes the link', () => {
    const create = vi.fn(() => 'blob:temp-url');
    const revoke = vi.fn();
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke }));
    const clicked: { href: string; download: string }[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked.push({ href: this.href, download: this.download });
    });

    downloadBlob(new Blob(['pdf']), 'receipt.pdf');

    expect(clicked).toEqual([{ href: 'blob:temp-url', download: 'receipt.pdf' }]);
    expect(revoke).toHaveBeenCalledWith('blob:temp-url');
    expect(document.querySelector('a[download]')).toBeNull();
    vi.unstubAllGlobals();
  });
});
