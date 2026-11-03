import type { ReactNode } from 'react';
import { RequireAuth } from '@/modules/auth';
import { CheckoutProvider } from '@/modules/checkout';

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <CheckoutProvider>{children}</CheckoutProvider>
    </RequireAuth>
  );
}
