'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useId } from 'react';

import messages from '@/i18n/messages/ar.json';
import { routes } from '@/shared/config/routes';
import { Icon } from '@/shared/ui/icon';
import { OverlayDialog } from '@/shared/ui/overlay/overlay-dialog';

import styles from './menu-sheet.module.css';
import { buildSheetEntries } from './sheet-groups';
import { isCurrentPath, type NavEntry } from './use-admin-nav';

const shell = messages.admin.shell;
const nav = messages.admin.nav;
const LOGO_SRC = '/logo-alasma.svg';
const SHEET_EXIT_DURATION = 300;

type MenuSheetProps = {
  entries: readonly NavEntry[];
  isOpen: boolean;
  onLogout: () => void;
  onOpenChange: (open: boolean) => void;
  roleLabel: string;
};

// The phone menu of the design (.am__sheet): the brand, the owner card, one collapsible group per section with its
// pages, then the store and logout. A page that is not built yet is inert with the soon hint.
export function MenuSheet({ entries, isOpen, onLogout, onOpenChange, roleLabel }: MenuSheetProps) {
  const titleId = useId();
  const pathname = usePathname() ?? '';
  const sheetEntries = buildSheetEntries(entries, pathname);

  return (
    <OverlayDialog
      className={styles.sheet ?? ''}
      closeOnBackdrop
      closeOnEscape
      exitDuration={SHEET_EXIT_DURATION}
      labelledBy={titleId}
      onOpenChange={onOpenChange}
      open={isOpen}
      role="dialog"
    >
      {/* a tap on a page link closes the sheet; the link itself still navigates */}
      <div
        onClick={(event) => {
          if ((event.target as HTMLElement).closest('a')) {
            onOpenChange(false);
          }
        }}
      >
        <h2 className={styles.srOnly} id={titleId}>
          {shell.sheet}
        </h2>
        <div className={styles.top}>
          <Image
            alt={messages.site.brand}
            className={styles.logo}
            height={84}
            src={LOGO_SRC}
            unoptimized
            width={104}
          />
          <button
            aria-label={shell.closeSheet}
            className={styles.close}
            data-autofocus
            onClick={() => onOpenChange(false)}
            type="button"
          >
            <Icon name="x" />
          </button>
        </div>
        <div className={styles.who}>
          <Icon name="feather" />
          <div>
            <b className={styles.whoName}>{shell.chipName}</b>
            <small className={styles.whoRole}>{roleLabel}</small>
          </div>
        </div>
        <nav aria-label={nav.label}>
          {sheetEntries.map((entry) => (
            <details className={styles.group} key={entry.id} open={entry.isCurrent}>
              <summary className={styles.summary}>
                <Icon name={entry.icon} />
                {entry.label}
                <span className={styles.chevron}>
                  <Icon name="chev-d" size="sm" />
                </span>
              </summary>
              <div className={styles.links}>
                {entry.lines.map((line) =>
                  line.href !== null ? (
                    <Link
                      aria-current={isCurrentPath(line.href, pathname) ? 'page' : undefined}
                      className={styles.link}
                      href={line.href}
                      key={line.key}
                    >
                      {line.label}
                    </Link>
                  ) : (
                    <span
                      aria-disabled="true"
                      className={styles.link}
                      data-soon
                      key={line.key}
                      title={nav.soon}
                    >
                      {line.label}
                      <span className={styles.srOnly}>{nav.soon}</span>
                    </span>
                  ),
                )}
              </div>
            </details>
          ))}
        </nav>
        <div className={styles.footer}>
          <span aria-disabled="true" className={`${styles.footerLink}`} data-soon title={nav.soon}>
            <Icon name="grid" />
            {shell.allSections}
            <span className={styles.srOnly}>{nav.soon}</span>
          </span>
          <Link className={styles.footerLink} href={routes.home}>
            <Icon name="globe" />
            {shell.viewStore}
          </Link>
          <button className={styles.footerLink} onClick={onLogout} type="button">
            <Icon name="logout" />
            {shell.logout}
          </button>
        </div>
      </div>
    </OverlayDialog>
  );
}
