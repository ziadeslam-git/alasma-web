import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AuthCard, LoginForm } from '@/modules/auth-screens';

export const metadata: Metadata = { robots: { index: false, follow: false } };

// LoginForm reads ?next with useSearchParams, which needs a Suspense boundary in a statically built page.
export default function LoginPage() {
  return (
    <AuthCard>
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
