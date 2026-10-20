'use client';

import { useState } from 'react';

import messages from '@/i18n/messages/ar.json';
import { Button } from '@/shared/ui/button';
import { Field } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { Modal, type ModalSize } from '@/shared/ui/modal';

import styles from '../components.module.css';

type Variant = ModalSize | 'alert' | 'blocking' | 'long';

const sizes: ModalSize[] = ['sm', 'md', 'lg'];

// Client wrapper that owns the open state: a Server page must never pass functions to a Modal.
export function ModalSection() {
  const text = messages.devComponents.modal;
  const [current, setCurrent] = useState<Variant | null>(null);
  const close = () => setCurrent(null);
  const changeOpen = (variant: Variant) => (isOpen: boolean) => setCurrent(isOpen ? variant : null);
  const footer = (
    <>
      <Button onClick={close} variant="outline">
        {text.actions.cancel}
      </Button>
      <Button onClick={close}>{text.actions.confirm}</Button>
    </>
  );

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>{text.heading}</h2>
      <div className={styles.row}>
        {sizes.map((size) => (
          <Button key={size} onClick={() => setCurrent(size)} variant="soft">
            {text.sizes[size]}
          </Button>
        ))}
        <Button onClick={() => setCurrent('alert')} variant="soft">
          {text.alert.open}
        </Button>
        <Button onClick={() => setCurrent('blocking')} variant="soft">
          {text.blocking.open}
        </Button>
        <Button onClick={() => setCurrent('long')} variant="soft">
          {text.long.open}
        </Button>
      </div>

      {sizes.map((size) => (
        <Modal
          closeLabel={text.close}
          description={text.description}
          footer={footer}
          key={size}
          onOpenChange={changeOpen(size)}
          open={current === size}
          size={size}
          title={`${text.title} (${text.sizes[size]})`}
        >
          <p>{text.body}</p>
          <Field label={text.field}>
            <Input data-autofocus />
          </Field>
        </Modal>
      ))}

      <Modal
        closeLabel={text.close}
        description={text.alert.description}
        footer={footer}
        onOpenChange={changeOpen('alert')}
        open={current === 'alert'}
        role="alertdialog"
        size="sm"
        title={text.alert.title}
      >
        <p>{text.alert.description}</p>
      </Modal>

      <Modal
        closeLabel={text.close}
        closeOnBackdrop={false}
        closeOnEscape={false}
        footer={<Button onClick={close}>{text.blocking.done}</Button>}
        onOpenChange={changeOpen('blocking')}
        open={current === 'blocking'}
        size="sm"
        title={text.blocking.title}
      >
        <p>{text.blocking.body}</p>
      </Modal>

      <Modal
        closeLabel={text.close}
        footer={footer}
        onOpenChange={changeOpen('long')}
        open={current === 'long'}
        title={text.long.title}
      >
        {Array.from({ length: 30 }, (_, index) => (
          <p key={index}>{text.long.paragraph}</p>
        ))}
      </Modal>
    </section>
  );
}
