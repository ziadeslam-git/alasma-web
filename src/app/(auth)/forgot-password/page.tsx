import type { Metadata } from 'next';
import { AuthCard, ForgotPasswordForm } from '@/modules/auth-screens';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function ForgotPasswordPage() {
  return (
    <AuthCard>
      <ForgotPasswordForm />
    </AuthCard>
  );
}
