'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import messages from '@/i18n/messages/ar.json';
import { useAuth } from '@/modules/auth';
import { routes } from '@/shared/config/routes';
import { Button } from '@/shared/ui/button';

import { ReviewFormModal } from './review-form-modal';

// "اكتب تقييمك": a visitor is sent to sign in and returns to the same page; a signed-in customer opens the form.
export function WriteReview({ bookId }: { bookId: number }) {
  const { status } = useAuth();
  const router = useRouter();
  const [isOpen, setOpen] = useState(false);

  function start() {
    if (status === 'anonymous') {
      const here = `${window.location.pathname}${window.location.search}#reviews`;
      router.push(`${routes.login}?next=${encodeURIComponent(here)}`);
      return;
    }
    if (status === 'authenticated') setOpen(true);
  }

  return (
    <>
      <Button disabled={status === 'loading'} fullWidth onClick={start} variant="outline">
        {messages.reviews.writeButton}
      </Button>
      {isOpen ? <ReviewFormModal bookId={bookId} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
