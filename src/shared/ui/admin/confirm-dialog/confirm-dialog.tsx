'use client';

import { useId, useRef, useState } from 'react';

import messages from '@/i18n/messages/ar.json';
import { Button } from '@/shared/ui/button';
import { Field } from '@/shared/ui/field';
import { Textarea } from '@/shared/ui/input';
import { Modal } from '@/shared/ui/modal';

import styles from './confirm-dialog.module.css';

export const DEFAULT_REASON_MAX = 500;
const copy = messages.admin.confirm;

export type ConfirmReason = {
  label: string;
  // 500 by default: the backend limit for a cancel / reject reason.
  maxLength?: number;
  mode: 'optional' | 'required';
  placeholder?: string;
};

export type ConfirmDialogProps = {
  cancelLabel?: string;
  confirmLabel: string;
  description: string;
  // Rejecting (throwing) keeps the dialog open with an error; resolving closes it.
  onConfirm: (reason: string) => Promise<void> | void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  reason?: ConfirmReason;
  title: string;
  tone?: 'danger' | 'normal';
};

export function ConfirmDialog({
  cancelLabel = copy.cancel,
  confirmLabel,
  description,
  onConfirm,
  onOpenChange,
  open,
  reason,
  title,
  tone = 'normal',
}: ConfirmDialogProps) {
  const [text, setText] = useState('');
  const [isPending, setPending] = useState(false);
  const [hasFailed, setFailed] = useState(false);
  // A ref, not state: two clicks in the same tick both see the old state, but only one sees the ref set.
  const inFlight = useRef(false);
  const counterId = useId();
  const max = reason?.maxLength ?? DEFAULT_REASON_MAX;
  const trimmed = text.trim();
  const isReasonMissing = reason?.mode === 'required' && trimmed.length === 0;
  const isDanger = tone === 'danger';

  function reset() {
    setText('');
    setFailed(false);
  }

  async function confirm() {
    if (inFlight.current || isReasonMissing) return;

    inFlight.current = true;
    setPending(true);
    setFailed(false);

    try {
      await onConfirm(trimmed);
      reset();
      onOpenChange(false);
    } catch {
      setFailed(true);
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next && inFlight.current) return;
    if (!next) reset();

    onOpenChange(next);
  }

  return (
    <Modal
      closeLabel={copy.close}
      closeOnBackdrop={false}
      closeOnEscape={!isPending}
      description={description}
      footer={
        <div className={styles.footer}>
          <Button
            data-autofocus={isDanger && !reason ? '' : undefined}
            disabled={isPending}
            onClick={() => handleOpenChange(false)}
            variant="outline"
          >
            {cancelLabel}
          </Button>
          <Button
            className={isDanger ? styles.danger : undefined}
            data-autofocus={!isDanger && !reason ? '' : undefined}
            disabled={isReasonMissing}
            loading={isPending}
            onClick={confirm}
          >
            {confirmLabel}
          </Button>
        </div>
      }
      onOpenChange={handleOpenChange}
      open={open}
      role="alertdialog"
      size="sm"
      title={title}
    >
      {reason ? (
        <Field
          hint={isReasonMissing && reason.mode === 'required' ? copy.reasonRequired : undefined}
          label={
            reason.mode === 'optional' ? `${reason.label} ${copy.reasonOptional}` : reason.label
          }
          required={reason.mode === 'required'}
        >
          <Textarea
            aria-describedby={counterId}
            data-autofocus=""
            disabled={isPending}
            maxLength={max}
            onChange={(event) => setText(event.target.value)}
            placeholder={reason.placeholder}
            value={text}
          />
          <span className={styles.counter} id={counterId}>
            {copy.reasonCounter
              .replace('{count}', String(text.length))
              .replace('{max}', String(max))}
          </span>
        </Field>
      ) : null}
      {hasFailed ? (
        <p className={styles.error} role="alert">
          {copy.failed}
        </p>
      ) : null}
      {isPending ? (
        <span className={styles.srOnly} role="status">
          {copy.working}
        </span>
      ) : null}
    </Modal>
  );
}
