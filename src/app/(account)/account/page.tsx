import type { Metadata } from 'next';
import { AccountOverview } from '@/modules/account';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AccountPage() {
  return <AccountOverview />;
}
