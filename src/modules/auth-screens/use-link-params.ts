'use client';

import { useEffect, useRef, useState } from 'react';

// The parameters of an e-mail link (userId, token), read ONCE after mount and then removed from the address bar so
// they stay out of history and the Referer header. They live only in component memory afterwards.
// null = not read yet (server render and first client render). The ref makes the read happen once even when React
// Strict Mode runs the effect twice (the second run would find the URL already cleaned).
export type LinkParams =
  { token: string; userId: number } | { token?: undefined; userId?: undefined };

export function useLinkParams(): LinkParams | null {
  const [params, setParams] = useState<LinkParams | null>(null);
  const hasRead = useRef(false);

  useEffect(() => {
    if (hasRead.current) {
      return;
    }

    hasRead.current = true;
    const query = new URLSearchParams(globalThis.location.search);
    const token = query.get('token')?.trim() ?? '';
    const rawUserId = query.get('userId') ?? '';
    const userId = /^[0-9]+$/.test(rawUserId) ? Number(rawUserId) : 0;

    globalThis.history.replaceState(globalThis.history.state, '', globalThis.location.pathname);
    setParams(token && Number.isSafeInteger(userId) && userId > 0 ? { token, userId } : {});
  }, []);

  return params;
}
