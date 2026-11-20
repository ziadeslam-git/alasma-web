'use client';

import { useState } from 'react';

import messages from '@/i18n/messages/ar.json';
import { useAuth } from '@/modules/auth';
import { ApiError, getApiErrorMessage } from '@/shared/lib/api';
import { Button } from '@/shared/ui/button';
import { Modal } from '@/shared/ui/modal';

import styles from './profile.module.css';

// Sign out on every device. A confirmation first (it ends this session too); on success useAuth().logoutAll has already
// cleared the local session, and RequireAuth sends the visitor to the login page. A failed call keeps the dialog open
// with the error, so the user never believes the other sessions ended when they did not.
export function LogoutAllSection() {
  const text = messages.account;
  const { logoutAll } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [alert, setAlert] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const confirm = async () => {
    if (isSubmitting) {
      return;
    }

    setAlert('');
    setIsSubmitting(true);

    try {
      await logoutAll();
    } catch (error) {
      setAlert(error instanceof ApiError ? getApiErrorMessage(error) : messages.apiErrors.generic);
      setIsSubmitting(false);
    }
  };

  return (
    <section aria-labelledby="sessions-section" className={styles.card}>
      <h2 id="sessions-section">{text.sessionsSection}</h2>
      <p className={styles.intro}>{text.sessionsDescription}</p>
      <div className={styles.actions}>
        <Button
          onClick={() => {
            setAlert('');
            setIsOpen(true);
          }}
          variant="outline"
        >
          {text.logoutAll}
        </Button>
      </div>
      <Modal
        closeLabel={text.close}
        description={text.logoutAllDescription}
        onOpenChange={(open) => {
          if (!isSubmitting) {
            setIsOpen(open);
          }
        }}
        open={isOpen}
        role="alertdialog"
        size="sm"
        title={text.logoutAllTitle}
      >
        <p
          className={alert ? `${styles.status} ${styles.statusError}` : styles.status}
          role="alert"
        >
          {alert}
        </p>
        <div className={styles.actions}>
          <Button loading={isSubmitting} onClick={() => void confirm()}>
            {text.logoutAllConfirm}
          </Button>
          <Button
            data-autofocus
            disabled={isSubmitting}
            onClick={() => setIsOpen(false)}
            variant="outline"
          >
            {text.cancel}
          </Button>
        </div>
      </Modal>
    </section>
  );
}
