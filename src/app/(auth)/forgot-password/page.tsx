import type { Metadata } from 'next';

import messages from '@/i18n/messages/ar.json';
import { AuthCard, ForgotPasswordForm } from '@/modules/auth-screens';

export const metadata: Metadata = {
  title: messages.seo.forgotPasswordTitle,
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <AuthCard>
      <ForgotPasswordForm />
    </AuthCard>
  );
}
