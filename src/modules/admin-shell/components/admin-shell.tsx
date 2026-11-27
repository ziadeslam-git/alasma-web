'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';

import messages from '@/i18n/messages/ar.json';
import { useAuth } from '@/modules/auth';
import { routes } from '@/shared/config/routes';
import { Button, ButtonLink } from '@/shared/ui/button';
import { Drawer } from '@/shared/ui/drawer';

import { useForbiddenHandler } from '../hooks/use-forbidden-handler';
import styles from './admin-shell.module.css';

const roleNames: Record<string, string> = messages.admin.roles;
const LOGO_SRC = '/logo-alasma.svg';

export type AdminShellProps = {
  children: ReactNode;
  // The menu. Shown beside the main area on wide screens and inside the drawer on phones.
  sidebar?: ReactNode;
  // The menu inside the phone drawer; defaults to the same element as the sidebar.
  drawerSidebar?: ReactNode;
};

// Header (name, role, back to the site, logout; a menu button on phones) + sidebar slot + main. It only renders for a
// signed-in staff user (AdminGate), so reading the user here loads nothing sensitive.
export function AdminShell({ children, drawerSidebar, sidebar }: AdminShellProps) {
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
            <Image
              alt={messages.site.brand}
              height={84}
              priority
              src={LOGO_SRC}
              unoptimized
              width={104}
            />
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
                className={styles.menuButton}
                label={text.menu}
                leadingIcon="menu"
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
        closeClassName={styles.drawerClose}
        closeLabel={text.closeMenu}
        headerLogo={
          <span className={styles.drawerLogo}>
            <Image alt="" height={84} src={LOGO_SRC} unoptimized width={104} />
          </span>
        }
        onOpenChange={setMenuOpen}
        open={isMenuOpen}
        side="start"
        title={text.menu}
      >
        {/* a tap on a menu link closes the drawer; the link itself still navigates */}
        <div
          className={styles.menuBody}
          onClick={(event) => {
            if ((event.target as HTMLElement).closest('a')) {
              setMenuOpen(false);
            }
          }}
        >
          <div className={styles.who}>
            <span className={styles.whoName}>{user?.fullName}</span>
            <span className={styles.whoRole}>{roleLabel}</span>
          </div>
          {drawerSidebar ?? sidebar}
          <div className={styles.menuActions}>
            <ButtonLink fullWidth href={routes.home} variant="outline">
              {text.backToSite}
            </ButtonLink>
            <Button fullWidth leadingIcon="logout" onClick={() => void logout()} variant="outline">
              {text.logout}
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
