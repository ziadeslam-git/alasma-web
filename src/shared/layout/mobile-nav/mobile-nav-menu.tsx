'use client';

import { useState, type ReactNode } from 'react';

import { Button } from '@/shared/ui/button';
import { Drawer } from '@/shared/ui/drawer';

import styles from './mobile-nav.module.css';

type MobileNavMenuProps = {
  children: ReactNode;
  closeLabel: string;
  label: string;
  title: string;
};

export function MobileNavMenu({ children, closeLabel, label, title }: MobileNavMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={styles.menu}>
      <Button
        label={label}
        leadingIcon="more"
        onClick={() => setIsOpen(true)}
        size="sm"
        variant="ghost"
      />
      <Drawer
        closeLabel={closeLabel}
        onOpenChange={setIsOpen}
        open={isOpen}
        side="start"
        title={title}
      >
        {children}
      </Drawer>
    </div>
  );
}
