'use client';

import { useState } from 'react';

import messages from '@/i18n/messages/ar.json';
import { formatMoney, formatNumber } from '@/shared/lib/format';
import { ConfirmDialog } from '@/shared/ui/admin/confirm-dialog';
import { ConflictDialog } from '@/shared/ui/admin/conflict-dialog';
import { STATUS_TONES, StatusPill, type StatusType } from '@/shared/ui/admin/status-pill';
import { StickySaveBar, UnsavedChangesGuard } from '@/shared/ui/admin/sticky-save-bar';
import { Button } from '@/shared/ui/button';

import styles from './admin-dialogs-demo.module.css';

export type DemoOpen = 'confirm' | 'conflict' | 'danger';
export type DemoBar = 'clean' | 'dirty' | 'saving';

const copy = messages.devAdminDialogs;
// A status the map does not know yet (a new backend enum member): shown as a neutral pill with the raw value.
const UNKNOWN_STATUS = 'FutureStatus';
const TYPES = Object.keys(STATUS_TONES) as StatusType[];

// Numbers go through the shared formatters (Latin digits), like every other screen.
const FIELDS = [
  {
    key: 'title',
    label: copy.conflictLabels.title,
    server: copy.conflictTitleServer,
    yours: copy.conflictTitleYours,
  },
  {
    key: 'price',
    label: copy.conflictLabels.price,
    server: formatMoney(200),
    yours: formatMoney(220),
  },
  {
    key: 'stock',
    label: copy.conflictLabels.stock,
    server: formatNumber(35),
    yours: formatNumber(40),
  },
];

export function AdminDialogsDemo({ initialBar }: { initialBar: DemoBar }) {
  const [open, setOpen] = useState<DemoOpen | null>(null);
  const [bar, setBar] = useState<DemoBar>(initialBar);

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>{copy.title}</h1>

      <section aria-labelledby="pills" className={styles.panel}>
        <h2 className={styles.heading} id="pills">
          {copy.pillsTitle}
        </h2>
        {TYPES.map((type) => (
          <div key={type} className={styles.row}>
            <span className={styles.type}>{copy.pillTypes[type]}</span>
            {Object.keys(STATUS_TONES[type]).map((status) => (
              <StatusPill key={status} status={status} type={type} />
            ))}
          </div>
        ))}
        <div className={styles.row}>
          <span className={styles.type}>{copy.unknownTitle}</span>
          <StatusPill status={UNKNOWN_STATUS} type="order" />
        </div>
      </section>

      <section aria-labelledby="dialogs" className={styles.panel}>
        <h2 className={styles.heading} id="dialogs">
          {copy.dialogsTitle}
        </h2>
        <div className={styles.row}>
          <Button onClick={() => setOpen('confirm')} variant="outline">
            {copy.openConfirm}
          </Button>
          <Button onClick={() => setOpen('danger')} variant="outline">
            {copy.openDanger}
          </Button>
          <Button onClick={() => setOpen('conflict')} variant="outline">
            {copy.openConflict}
          </Button>
        </div>
      </section>

      <section aria-labelledby="bar" className={styles.panel}>
        <h2 className={styles.heading} id="bar">
          {copy.barTitle}
        </h2>
        <div className={styles.row}>
          <Button onClick={() => setBar('dirty')} variant="soft">
            {copy.makeEdit}
          </Button>
          <a className={styles.link} href="/dev/admin-table">
            {copy.leaveLink}
          </a>
        </div>
        <StickySaveBar
          isDirty={bar !== 'clean'}
          isSaving={bar === 'saving'}
          onRevert={() => setBar('clean')}
          onSave={() => setBar('saving')}
        />
      </section>

      <UnsavedChangesGuard isDirty={bar !== 'clean'} />

      <ConfirmDialog
        confirmLabel={copy.confirmAction}
        description={copy.confirmDescription}
        onConfirm={() => undefined}
        onOpenChange={(next) => setOpen(next ? 'confirm' : null)}
        open={open === 'confirm'}
        title={copy.confirmTitle}
      />
      <ConfirmDialog
        confirmLabel={copy.dangerAction}
        description={copy.dangerDescription}
        onConfirm={() => undefined}
        onOpenChange={(next) => setOpen(next ? 'danger' : null)}
        open={open === 'danger'}
        reason={{ label: copy.reasonLabel, mode: 'required', placeholder: copy.reasonPlaceholder }}
        title={copy.dangerTitle}
        tone="danger"
      />
      <ConflictDialog
        fields={FIELDS}
        onKeepMine={() => undefined}
        onLoadServer={() => undefined}
        onOpenChange={(next) => setOpen(next ? 'conflict' : null)}
        open={open === 'conflict'}
      />
    </main>
  );
}
