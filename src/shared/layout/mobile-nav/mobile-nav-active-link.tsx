'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

type MobileNavActiveLinkProps = {
  children: ReactNode;
  className?: string;
  href: string;
  label: string;
};

export function MobileNavActiveLink({
  children,
  className,
  href,
  label,
}: MobileNavActiveLinkProps) {
  const pathname = usePathname();
  const isCurrent = pathname === href;

  return (
    <Link
      aria-current={isCurrent ? 'page' : undefined}
      aria-label={label}
      className={className}
      href={href}
    >
      {children}
    </Link>
  );
}
