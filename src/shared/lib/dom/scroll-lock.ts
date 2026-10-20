// One scroll lock shared by every overlay. The first lock hides the page scroll (and pads for the scrollbar that
// disappears, so the layout does not jump); the last unlock restores the original styles. Locks are counted, so two
// stacked overlays release the page only when both are closed.
export type ScrollLock = {
  readonly count: number;
  lock: () => () => void;
};

export function createScrollLock(getDocument: () => Document): ScrollLock {
  let count = 0;
  let saved: {
    overflow: string;
    padding: string;
    side: 'paddingInlineEnd' | 'paddingInlineStart';
  } | null = null;

  const apply = (doc: Document) => {
    const body = doc.body;
    const view = doc.defaultView;
    const scrollbar = (view?.innerWidth ?? 0) - doc.documentElement.clientWidth;
    // the scrollbar sits at the inline-start side in RTL and the inline-end side in LTR
    const side =
      view?.getComputedStyle(doc.documentElement).direction === 'rtl'
        ? 'paddingInlineStart'
        : 'paddingInlineEnd';
    const padding = view ? Number.parseFloat(view.getComputedStyle(body)[side]) || 0 : 0;

    saved = { overflow: body.style.overflow, padding: body.style[side], side };
    body.style.overflow = 'hidden';

    if (scrollbar > 0) {
      body.style[side] = `${padding + scrollbar}px`;
    }
  };

  const restore = (doc: Document) => {
    if (saved) {
      doc.body.style.overflow = saved.overflow;
      doc.body.style[saved.side] = saved.padding;
      saved = null;
    }
  };

  return {
    get count() {
      return count;
    },
    lock() {
      const doc = getDocument();

      if (count === 0) {
        apply(doc);
      }

      count += 1;
      let isReleased = false;

      return () => {
        if (isReleased) {
          return;
        }

        isReleased = true;
        count -= 1;

        if (count === 0) {
          restore(doc);
        }
      };
    },
  };
}

export const scrollLock = createScrollLock(() => document);
