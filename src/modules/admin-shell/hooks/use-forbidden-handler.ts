'use client';

import { useEffect } from 'react';

import messages from '@/i18n/messages/ar.json';
import { getAuthApi, subscribeForbidden, useAuth } from '@/modules/auth';
import { useToast } from '@/shared/ui/toast';

// Any 403 the API answers on an action inside the admin area: tell the user, and load /me again so the screen follows
// the permissions the API has now (an admin may have lost one since sign-in).
export function useForbiddenHandler() {
  const { setUser } = useAuth();
  const toast = useToast();

  useEffect(
    () =>
      subscribeForbidden(() => {
        toast.show(messages.admin.forbiddenToast, {
          closeLabel: messages.admin.toastClose,
          kind: 'error',
        });
        void getAuthApi()
          .me()
          .then(setUser)
          .catch(() => undefined);
      }),
    [setUser, toast],
  );
}
