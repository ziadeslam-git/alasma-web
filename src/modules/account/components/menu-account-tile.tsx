'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import messages from '@/i18n/messages/ar.json';
import { useAuth } from '@/modules/auth';
import { routes } from '@/shared/config/routes';
import { Icon } from '@/shared/ui/icon';
import { FeatureLink } from '@/shared/ui/soon';

// The account tile of the phone menu (design .mn__q): the account area for a signed-in visitor, the login page for a
// guest (a guest has no account to open). The wishlist pages are not "the account" for the current-page mark.
export function MenuAccountTile() {
  const { status } = useAuth();
  const pathname = usePathname() ?? '';
  const content = (
    <>
      <Icon name="user" />
      <span>{messages.account.title}</span>
    </>
  );

  if (status !== 'authenticated') {
    return (
      <Link aria-current={pathname === routes.login ? 'page' : undefined} href={routes.login}>
        {content}
      </Link>
    );
  }

  const isInsideAccount = pathname === routes.account || pathname.startsWith(`${routes.account}/`);
  const isWishlist =
    pathname === routes.accountWishlist || pathname.startsWith(`${routes.accountWishlist}/`);
  return (
    <FeatureLink
      current={isInsideAccount && !isWishlist ? 'page' : undefined}
      feature="account-area"
      href={routes.account}
      label={messages.site.soon}
    >
      {content}
    </FeatureLink>
  );
}
