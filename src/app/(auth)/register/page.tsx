import type { Metadata } from 'next';
import { AuthCard, RegisterForm } from '@/modules/auth-screens';
export const metadata: Metadata = { robots: { index: false, follow: false } };
export default function RegisterPage() {
  return (
    <AuthCard>
      <RegisterForm />
    </AuthCard>
  );
}
