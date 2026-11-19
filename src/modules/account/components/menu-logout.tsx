'use client';

import messages from '@/i18n/messages/ar.json';
import { useAuth } from '@/modules/auth';
import { Button } from '@/shared/ui/button';

// Logout at the bottom of the mobile menu (up to 1000px), for signed-in visitors. It is the same handler the account
// dropdown and the account page use: useAuth().logout, no new API logic. data-close-menu lets the menu shut itself.
export function MenuLogout() {
  const { status, logout } = useAuth();
  if (status !== 'authenticated') return null;
  return (
    <div data-close-menu>
      <Button fullWidth onClick={() => void logout()} variant="outline">
        {messages.account.logout}
      </Button>
    </div>
  );
}
