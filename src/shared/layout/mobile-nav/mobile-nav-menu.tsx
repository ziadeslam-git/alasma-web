'use client';

import Image from 'next/image';
import { useState, type MouseEvent, type ReactNode } from 'react';

import messages from '@/i18n/messages/ar.json';
import { Drawer } from '@/shared/ui/drawer';

import styles from './mobile-nav.module.css';

type MobileNavMenuProps = {
  children: ReactNode;
  closeLabel: string;
  // Pinned below the links, visually separated (the account module puts logout here for signed-in visitors).
  footer?: ReactNode;
  label: string;
  title: string;
};

// A link or an element marked data-close-menu closes the menu when it is used: the header outlives a client navigation, so
// without this the open menu stayed on top of the page that was just opened (and of the signed-out menu after logout).
function closesMenu(event: MouseEvent<HTMLElement>) {
  return event.target instanceof Element && event.target.closest('a, [data-close-menu]') !== null;
}

export function MobileNavMenu({ children, closeLabel, footer, label, title }: MobileNavMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const closeOnUse = (event: MouseEvent<HTMLElement>) => {
    if (closesMenu(event)) setIsOpen(false);
  };

  return (
    <div className={styles.menu}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={label}
        className={styles.burger}
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>
      <Drawer
        closeLabel={closeLabel}
        headerLogo={
          <Image
            alt={messages.site.brand}
            height={136}
            src="/logo-alasma.svg"
            unoptimized
            width={168}
          />
        }
        onOpenChange={setIsOpen}
        footer={footer ? <div onClick={closeOnUse}>{footer}</div> : undefined}
        open={isOpen}
        side="start"
        title={title}
        variant="brand"
      >
        <div onClick={closeOnUse}>{children}</div>
      </Drawer>
    </div>
  );
}
