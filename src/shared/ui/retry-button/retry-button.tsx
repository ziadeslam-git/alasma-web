'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { Button } from '@/shared/ui/button';

// Re-renders the current route on the server (router.refresh), so a list that failed to load can recover without a
// full page reload. A link to the same URL was rejected: a soft navigation to the URL already shown may be answered
// from the client router cache and show the same failure again.
export function RetryButton({ label }: { label: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      disabled={isPending}
      onClick={() => startTransition(() => router.refresh())}
      variant="outline"
    >
      {label}
    </Button>
  );
}
