'use client';

import { useState } from 'react';

import messages from '@/i18n/messages/ar.json';
import { Button } from '@/shared/ui/button';
import { Drawer, type DrawerSide } from '@/shared/ui/drawer';
import { Modal } from '@/shared/ui/modal';

import styles from '../components.module.css';

const sides: DrawerSide[] = ['start', 'end'];

// Client wrapper that owns the open state: a Server page must never pass functions to a Drawer.
export function DrawerSection() {
  const text = messages.devComponents.drawer;
  const modalText = messages.devComponents.modal;
  const [current, setCurrent] = useState<DrawerSide | null>(null);
  const [isNestedOpen, setIsNestedOpen] = useState(false);

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>{text.heading}</h2>
      <div className={styles.row}>
        {sides.map((side) => (
          <Button key={side} onClick={() => setCurrent(side)} variant="soft">
            {text[side]}
          </Button>
        ))}
      </div>

      {sides.map((side) => (
        <Drawer
          closeLabel={text.close}
          key={side}
          onOpenChange={(isOpen) => setCurrent(isOpen ? side : null)}
          open={current === side}
          side={side}
          title={side === 'start' ? text.startTitle : text.endTitle}
        >
          <p>{text.body}</p>
          <ul>
            {text.list.map((item) => (
              <li key={item}>
                <a href="#top">{item}</a>
              </li>
            ))}
          </ul>
          <Button onClick={() => setIsNestedOpen(true)} variant="outline">
            {text.openNested}
          </Button>
        </Drawer>
      ))}

      <Modal
        closeLabel={modalText.close}
        footer={<Button onClick={() => setIsNestedOpen(false)}>{modalText.actions.confirm}</Button>}
        onOpenChange={setIsNestedOpen}
        open={isNestedOpen}
        size="sm"
        title={modalText.nested.title}
      >
        <p>{modalText.nested.body}</p>
      </Modal>
    </section>
  );
}
