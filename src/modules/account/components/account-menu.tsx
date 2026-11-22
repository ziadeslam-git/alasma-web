'use client';

import Link from 'next/link';
import { useState } from 'react';

import messages from '@/i18n/messages/ar.json';
import { useAuth } from '@/modules/auth';
import { routes } from '@/shared/config/routes';
import { ButtonLink } from '@/shared/ui/button';
import { Drawer } from '@/shared/ui/drawer';
import { Icon } from '@/shared/ui/icon';
import { useResolvedFeatureState } from '@/shared/config/feature-flags';

import styles from './account.module.css';

export function AccountMenu() {
  const { status, user, logout } = useAuth();
  const [isOpen, setOpen] = useState(false);
  const text = messages.account;
  // The bell has no API yet: it is only dimmed, with the soon label in its tooltip and accessible name.
  const bellState = useResolvedFeatureState('notifications-center');

  if (status !== 'authenticated' || !user) {
    return (
      <div className={styles.guestLinks}>
        <ButtonLink href={routes.login} size="sm" variant="ghost">
          {messages.site.header.login}
        </ButtonLink>
        <ButtonLink href={routes.register} size="sm" variant="outline">
          {messages.site.header.register}
        </ButtonLink>
      </div>
    );
  }

  return (
    <>
      {bellState === 'hidden' ? null : (
        <span
          aria-label={`${text.notifications} (${messages.site.soon})`}
          className={styles.bell}
          role="img"
          title={messages.site.soon}
        >
          <Icon name="bell" />
        </span>
      )}
      <button
        aria-label={user.fullName}
        className={styles.accountButton}
        onClick={() => setOpen(true)}
        type="button"
      >
        <span aria-hidden="true" className={styles.avatar}>
          {user.fullName.trim().charAt(0)}
        </span>
      </button>
      <Drawer
        closeLabel={messages.site.header.closeMenu}
        onOpenChange={setOpen}
        open={isOpen}
        side="start"
        title={text.navigation}
      >
        <nav aria-label={text.navigation} className={styles.accountMenu}>
          <Link data-autofocus href={routes.account} onClick={() => setOpen(false)}>
            {text.title}
          </Link>
          <Link href={routes.accountOrders} onClick={() => setOpen(false)}>
            {text.orders}
          </Link>
          <Link href={routes.accountAddresses} onClick={() => setOpen(false)}>
            {text.addresses}
          </Link>
          <button
            onClick={() => {
              setOpen(false);
              void logout();
            }}
            type="button"
          >
            {text.logout}
          </button>
        </nav>
      </Drawer>
    </>
  );
}
