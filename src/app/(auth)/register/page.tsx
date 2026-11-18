import type { Metadata } from 'next';

import messages from '@/i18n/messages/ar.json';
import { AuthCard, RegisterForm } from '@/modules/auth-screens';
export const metadata: Metadata = {
  title: messages.seo.registerTitle,
  robots: { index: false, follow: false },
};
export default function RegisterPage() {
  return (
    <AuthCard>
      <RegisterForm />
    </AuthCard>
  );
}
