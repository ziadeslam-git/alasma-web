'use client';

import messages from '@/i18n/messages/ar.json';
import { ConfirmDialog } from '@/shared/ui/admin/confirm-dialog';

import { useUnsavedChangesGuard } from './use-unsaved-changes-guard';

const copy = messages.admin.leave;

// Render it once on a page with a form: <UnsavedChangesGuard isDirty={isDirty} />.
export function UnsavedChangesGuard({ isDirty }: { isDirty: boolean }) {
  const guard = useUnsavedChangesGuard(isDirty);

  return (
    <ConfirmDialog
      cancelLabel={copy.stay}
      confirmLabel={copy.leave}
      description={copy.description}
      onConfirm={guard.leave}
      onOpenChange={(open) => {
        if (!open) guard.stay();
      }}
      open={guard.isPromptOpen}
      title={copy.title}
      tone="danger"
    />
  );
}
