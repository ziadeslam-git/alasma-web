import { describe, expect, it } from 'vitest';

import { createScrollLock } from './scroll-lock';

function fakeDocument(scrollbarWidth: number, direction = 'ltr') {
  const body = { style: { overflow: 'auto', paddingInlineEnd: '', paddingInlineStart: '' } };
  const doc = {
    body,
    defaultView: {
      getComputedStyle: () => ({ direction, paddingInlineEnd: '8px', paddingInlineStart: '8px' }),
      innerWidth: 1000,
    },
    documentElement: { clientWidth: 1000 - scrollbarWidth },
  };

  return { body, doc: doc as unknown as Document };
}

describe('scroll lock', () => {
  it('hides the scroll on the first lock and pads for the missing scrollbar', () => {
    const { body, doc } = fakeDocument(15);
    const lock = createScrollLock(() => doc);

    lock.lock();

    expect(body.style.overflow).toBe('hidden');
    expect(body.style.paddingInlineEnd).toBe('23px');
    expect(lock.count).toBe(1);
  });

  it('pads the inline-start side in RTL, where the scrollbar is', () => {
    const { body, doc } = fakeDocument(15, 'rtl');
    const lock = createScrollLock(() => doc);

    const release = lock.lock();
    expect(body.style.paddingInlineStart).toBe('23px');
    expect(body.style.paddingInlineEnd).toBe('');

    release();
    expect(body.style.paddingInlineStart).toBe('');
  });

  it('adds no padding when there is no scrollbar', () => {
    const { body, doc } = fakeDocument(0);

    createScrollLock(() => doc).lock();

    expect(body.style.paddingInlineEnd).toBe('');
  });

  it('restores the original styles only when the last lock is released', () => {
    const { body, doc } = fakeDocument(15);
    const lock = createScrollLock(() => doc);

    const releaseFirst = lock.lock();
    const releaseSecond = lock.lock();
    expect(lock.count).toBe(2);

    releaseFirst();
    expect(body.style.overflow).toBe('hidden');

    releaseSecond();
    expect(body.style.overflow).toBe('auto');
    expect(body.style.paddingInlineEnd).toBe('');
    expect(lock.count).toBe(0);
  });

  it('ignores a second release of the same lock', () => {
    const { doc } = fakeDocument(15);
    const lock = createScrollLock(() => doc);

    const release = lock.lock();
    lock.lock();
    release();
    release();

    expect(lock.count).toBe(1);
  });
});
