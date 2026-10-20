'use client';

import { useCallback, useState } from 'react';

// Open state that is controlled when `open` is given, and kept inside otherwise (defaultOpen).
export function useControllableOpen(
  open: boolean | undefined,
  defaultOpen: boolean,
  onOpenChange: ((open: boolean) => void) | undefined,
) {
  const [isInnerOpen, setInnerOpen] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setInnerOpen(next);
      }

      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  return [isControlled ? open : isInnerOpen, setOpen] as const;
}
