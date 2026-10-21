import type { Metadata } from 'next';
import { AuthCard, ConfirmEmailView } from '@/modules/auth-screens';

export const metadata: Metadata = {
  referrer: 'no-referrer',
  robots: { index: false, follow: false },
};

export default function ConfirmEmailPage() {
  return (
    <AuthCard>
      <ConfirmEmailView />
    </AuthCard>
  );
}
