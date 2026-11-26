import type { ReactNode } from 'react';

import { AuthSplit } from '@/modules/auth-screens';

// AuthProvider and the toast area are mounted once in the root layout.
// The auth pages use the split-screen frame (design/Login.dc.html) with no site header or footer.
export default function AuthLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <AuthSplit>{children}</AuthSplit>;
}
