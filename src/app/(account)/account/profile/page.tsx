import type { Metadata } from 'next';

import { ProfileEditView } from '@/modules/account';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function ProfilePage() {
  return <ProfileEditView />;
}
