import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { AuthPlayground } from './auth-playground';

export const metadata: Metadata = {
  title: 'Auth (dev)',
  robots: { index: false, follow: false },
};

// Development page to exercise the session by hand (login, logout, parallel calls, forced refresh). It never shows the
// access token. It returns 404 in production.
export default function DevAuthPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return (
    <main>
      <AuthPlayground />
    </main>
  );
}
