import type { Metadata } from 'next';

import messages from '@/i18n/messages/ar.json';
import { AuthCard, ResetPasswordForm } from '@/modules/auth-screens';

export const metadata: Metadata = {
  title: messages.seo.resetPasswordTitle,
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
