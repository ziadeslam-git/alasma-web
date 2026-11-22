'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import messages from '@/i18n/messages/ar.json';
import type { FeatureKey } from '@/shared/config/features';
import { FeatureLink } from '@/shared/ui/soon';

// A link of the header navigation that knows the current page: it gets aria-current, which the header styles as the
// green-tint pill of design/site.css (.nav__links a[aria-current]). A link whose feature is still soon is left out.
export function HeaderLink({
  feature,
  href,
  label,
  isExact = false,
}: {
  feature?: FeatureKey;
  href: string;
  label: string;
  isExact?: boolean;
}) {
  const pathname = usePathname() ?? '';
  const isCurrent = isExact
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
  const current = isCurrent ? 'page' : undefined;
  if (!feature) {
    return (
      <Link aria-current={current} href={href}>
        {label}
      </Link>
    );
  }
  return (
    <FeatureLink
      current={current}
      feature={feature}
      href={href}
      label={messages.site.soon}
      whenSoon="hide"
    >
      {label}
    </FeatureLink>
  );
}
