'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';

import messages from '@/i18n/messages/ar.json';
import { useAuth } from '@/modules/auth';
import { routes } from '@/shared/config/routes';
import { Button, ButtonLink } from '@/shared/ui/button';
import { Drawer } from '@/shared/ui/drawer';
import { Icon } from '@/shared/ui/icon';

import { useForbiddenHandler } from '../hooks/use-forbidden-handler';
import styles from './admin-shell.module.css';

const roleNames: Record<string, string> = messages.admin.roles;

export type AdminShellProps = {
  children: ReactNode;
  // The sidebar of the next task. Empty for now: an empty slot takes no room.
  sidebar?: ReactNode;
};

// Header (name, role, back to the site, logout; a menu button on phones) + sidebar slot + main. It only renders for a
// signed-in staff user (AdminGate), so reading the user here loads nothing sensitive.
export function AdminShell({ children, sidebar }: AdminShellProps) {
  const text = messages.admin.shell;
  const { user, logout } = useAuth();
  const [isMenuOpen, setMenuOpen] = useState(false);
  useForbiddenHandler();

  const roleLabel = (user?.roles ?? []).map((role) => roleNames[role] ?? role).join(' / ');

  return (
    <div className={styles.page} data-admin-frame>
      <div className={styles.frame}>
        <header className={styles.header}>
          <Link className={styles.brand} href={routes.admin}>
            <span aria-hidden="true" className={styles.brandMark}>
              <Icon name="shield" size="sm" />
            </span>
            {text.brand}
          </Link>
          <div className={styles.actions}>
            <div className={styles.who}>
              <span className={styles.whoName}>{user?.fullName}</span>
              <span className={styles.whoRole}>{roleLabel}</span>
            </div>
            <div className={styles.desktopOnly}>
              <ButtonLink href={routes.home} size="sm" variant="ghost">
                {text.backToSite}
              </ButtonLink>
              <Button onClick={() => void logout()} size="sm" variant="outline">
                {text.logout}
              </Button>
            </div>
            <div className={styles.phoneOnly}>
              <Button
                label={text.menu}
                leadingIcon="more"
                onClick={() => setMenuOpen(true)}
                size="sm"
                variant="ghost"
              />
            </div>
          </div>
        </header>
        <div className={styles.body}>
          <aside aria-label={text.sidebar} className={styles.sidebar}>
            {sidebar}
          </aside>
          <main aria-label={text.main} className={styles.main} id="main">
            {children}
          </main>
        </div>
      </div>
      <Drawer
        closeLabel={text.closeMenu}
        onOpenChange={setMenuOpen}
        open={isMenuOpen}
        side="start"
        title={text.menu}
      >
        <div className={styles.menuBody}>
          <div className={styles.who}>
            <span className={styles.whoName}>{user?.fullName}</span>
            <span className={styles.whoRole}>{roleLabel}</span>
          </div>
          {sidebar}
          <div className={styles.menuActions}>
            <ButtonLink fullWidth href={routes.home} variant="outline">
              {text.backToSite}
            </ButtonLink>
            <Button fullWidth onClick={() => void logout()} variant="outline">
              {text.logout}
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
