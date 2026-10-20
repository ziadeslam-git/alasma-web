'use client';

import messages from '@/i18n/messages/ar.json';
import { Button } from '@/shared/ui/button';
import { ToastProvider, useToast, type ToastKind } from '@/shared/ui/toast';

import styles from '../components.module.css';

const toastKinds: ToastKind[] = ['success', 'error', 'info', 'warning'];

export function ToastSection() {
  const text = messages.devComponents.toast;

  return (
    <ToastProvider label={text.label}>
      <ToastTriggers />
    </ToastProvider>
  );
}

function ToastTriggers() {
  const { show } = useToast();
  const text = messages.devComponents.toast;

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>{text.heading}</h2>
      <div className={styles.row}>
        {toastKinds.map((kind) => (
          <Button
            key={kind}
            onClick={() => show(text.messages[kind], { closeLabel: text.close, kind })}
            variant="soft"
          >
            {text.kinds[kind]}
          </Button>
        ))}
      </div>
    </section>
  );
}
