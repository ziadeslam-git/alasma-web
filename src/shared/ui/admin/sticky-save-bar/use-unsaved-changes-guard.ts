'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// If this click would leave the current page for another page of the app, returns where to. Returns null for
// everything the guard must leave alone: modified clicks (new tab), downloads, other origins (the browser's own
// beforeunload prompt covers those), and links to the same page or to an anchor on it.
export function getLeavingHref(
  event: MouseEvent,
  current: Pick<Location, 'href' | 'origin' | 'pathname' | 'search'>,
) {
  const isModified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;

  if (event.defaultPrevented || event.button !== 0 || isModified) return null;

  const target = event.target instanceof Element ? event.target : null;
  const anchor = target?.closest<HTMLAnchorElement>('a[href]') ?? null;

  if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return null;

  const url = new URL(anchor.href, current.href);

  if (url.origin !== current.origin) return null;
  if (url.pathname === current.pathname && url.search === current.search) return null;

  return `${url.pathname}${url.search}${url.hash}`;
}

// While `isDirty`: closing/reloading the tab asks through the browser (beforeunload), and a click on an in-app link
// is held back and handed to a confirm dialog (isPromptOpen / stay / leave).
export function useUnsavedChangesGuard(isDirty: boolean) {
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    if (!isDirty) return undefined;

    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = '';
    }

    function onClick(event: MouseEvent) {
      const href = getLeavingHref(event, window.location);

      if (href === null) return;

      event.preventDefault();
      event.stopPropagation();
      setPendingHref(href);
    }

    window.addEventListener('beforeunload', onBeforeUnload);
    // Capture phase: runs before the router's own link handler, which is then never called.
    document.addEventListener('click', onClick, true);

    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('click', onClick, true);
    };
  }, [isDirty]);

  return {
    isPromptOpen: pendingHref !== null,
    leave: () => {
      const href = pendingHref;

      setPendingHref(null);
      if (href !== null) router.push(href);
    },
    stay: () => setPendingHref(null),
  };
}
