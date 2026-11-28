'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';

import messages from '@/i18n/messages/ar.json';
import { useAuth } from '@/modules/auth';
import { routes } from '@/shared/config/routes';
import { Icon } from '@/shared/ui/icon';

import { useForbiddenHandler } from '../hooks/use-forbidden-handler';
import { Appbar } from '../nav/appbar';
import { MenuSheet } from '../nav/menu-sheet';
import { Rail } from '../nav/rail';
import { TopNav } from '../nav/top-nav';
import { useAdminNav } from '../nav/use-admin-nav';
import styles from './admin-shell.module.css';

const roleNames: Record<string, string> = messages.admin.roles;
const LOGO_SRC = '/logo-alasma.svg';

// The admin frame of the design: logo, pill top navigation, search/bell/menu pill and the brand chip on top; the slim
// icon rail beside the page; the menu sheet and the bottom bar on phones. It only renders for a signed-in staff user
// (AdminGate), so reading the user here loads nothing sensitive. Search and alerts have no page yet, so they are
// inert.
export function AdminShell({ children }: { children: ReactNode }) {
  const text = messages.admin.shell;
  const { user, logout } = useAuth();
  const entries = useAdminNav();
  const [isMenuOpen, setMenuOpen] = useState(false);
  useForbiddenHandler();

  const roleLabel = (user?.roles ?? []).map((role) => roleNames[role] ?? role).join(' / ');
  const handleLogout = () => void logout();

  return (
    <div className={styles.page} data-admin-frame>
      <div className={styles.frame}>
        <header className={styles.top}>
          <Link aria-label={text.home} className={styles.logo} href={routes.admin}>
            <Image
              alt={messages.site.brand}
              className={styles.logoImage}
              height={84}
              priority
              src={LOGO_SRC}
              unoptimized
              width={104}
            />
          </Link>
          <TopNav entries={entries} />
          <div className={styles.tools}>
            <div className={`${styles.pill} ${styles.toolPill}`}>
              <button
                aria-label={text.search}
                className={styles.ibtn}
                disabled
                title={messages.admin.nav.soon}
                type="button"
              >
                <Icon name="search" />
              </button>
              <button
                aria-label={text.alerts}
                className={styles.ibtn}
                disabled
                title={messages.admin.nav.soon}
                type="button"
              >
                <Icon name="bell" />
              </button>
              <button
                aria-label={text.openMenu}
                className={`${styles.ibtn} ${styles.burger}`}
                onClick={() => setMenuOpen(true)}
                type="button"
              >
                <Icon name="menu" />
              </button>
            </div>
            <div className={styles.brandchip}>
              <Icon name="feather" />
              <div className={styles.brandText}>
                <b className={styles.brandName}>{text.chipName}</b>
                <small className={styles.brandRole}>{roleLabel}</small>
              </div>
            </div>
          </div>
        </header>
        <div className={styles.body}>
          <Rail entries={entries} onLogout={handleLogout} />
          <main aria-label={text.main} className={styles.main} id="main">
            {children}
          </main>
        </div>
      </div>
      <Appbar entries={entries} onMore={() => setMenuOpen(true)} />
      <MenuSheet
        entries={entries}
        isOpen={isMenuOpen}
        onLogout={handleLogout}
        onOpenChange={setMenuOpen}
        roleLabel={roleLabel}
      />
    </div>
  );
}
