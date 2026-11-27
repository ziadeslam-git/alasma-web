'use client';

import { useRef, useState } from 'react';

import messages from '@/i18n/messages/ar.json';
import { Button } from '@/shared/ui/button';
import { Modal } from '@/shared/ui/modal';

import styles from './conflict-dialog.module.css';

const copy = messages.admin.conflict;

// Values are shown as given: the caller formats them (money, dates) with the shared helpers.
export type ConflictField = {
  key: string;
  label: string;
  server: string;
  yours: string;
};

export type ConflictDialogProps = {
  fields: readonly ConflictField[];
  // Fetch the server copy and replace the form with it.
  onLoadServer: () => Promise<void> | void;
  // Fetch the server copy, then save the user's edit with the NEW rowVersion (see keepMineWithFreshVersion).
  onKeepMine: () => Promise<void> | void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

type Choice = 'keep' | 'load';

export function ConflictDialog({
  fields,
  onKeepMine,
  onLoadServer,
  onOpenChange,
  open,
}: ConflictDialogProps) {
  const [pending, setPending] = useState<Choice | null>(null);
  const [hasFailed, setFailed] = useState(false);
  const inFlight = useRef(false);

  async function run(choice: Choice, action: () => Promise<void> | void) {
    if (inFlight.current) return;

    inFlight.current = true;
    setPending(choice);
    setFailed(false);

    try {
      await action();
      onOpenChange(false);
    } catch {
      setFailed(true);
    } finally {
      inFlight.current = false;
      setPending(null);
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next && inFlight.current) return;
    if (!next) setFailed(false);

    onOpenChange(next);
  }

  const isBusy = pending !== null;

  return (
    <Modal
      closeLabel={copy.close}
      closeOnBackdrop={false}
      closeOnEscape={!isBusy}
      description={copy.description}
      footer={
        <div className={styles.footer}>
          <Button
            data-autofocus=""
            disabled={isBusy && pending !== 'load'}
            loading={pending === 'load'}
            onClick={() => run('load', onLoadServer)}
          >
            {copy.loadServer}
          </Button>
          <Button
            disabled={isBusy && pending !== 'keep'}
            loading={pending === 'keep'}
            onClick={() => run('keep', onKeepMine)}
            variant="outline"
          >
            {copy.keepMine}
          </Button>
          <Button disabled={isBusy} onClick={() => handleOpenChange(false)} variant="ghost">
            {copy.cancel}
          </Button>
        </div>
      }
      onOpenChange={handleOpenChange}
      open={open}
      role="alertdialog"
      size="md"
      title={copy.title}
    >
      {fields.length === 0 ? (
        <p className={styles.empty}>{copy.noFields}</p>
      ) : (
        <table aria-label={copy.diffLabel} className={styles.diff}>
          <thead className={styles.head}>
            <tr>
              <th scope="col">{copy.fieldColumn}</th>
              <th scope="col">{copy.yours}</th>
              <th scope="col">{copy.server}</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((field) => (
              <tr key={field.key} className={styles.row}>
                <th className={styles.field} scope="row">
                  {field.label}
                </th>
                <td className={styles.yours} data-label={copy.yours}>
                  {field.yours}
                </td>
                <td className={styles.server} data-label={copy.server}>
                  {field.server}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {hasFailed ? (
        <p className={styles.error} role="alert">
          {copy.failed}
        </p>
      ) : null}
    </Modal>
  );
}
