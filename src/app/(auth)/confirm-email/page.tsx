import type { Metadata } from 'next';

import messages from '@/i18n/messages/ar.json';
import { AuthCard, ConfirmEmailView } from '@/modules/auth-screens';

export const metadata: Metadata = {
  title: messages.seo.confirmEmailTitle,
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
