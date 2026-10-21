import type { Metadata } from 'next';
import { AuthCard, ResetPasswordForm } from '@/modules/auth-screens';

export const metadata: Metadata = {
  referrer: 'no-referrer',
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <AuthCard>
      <ResetPasswordForm />
    </AuthCard>
  );
}
