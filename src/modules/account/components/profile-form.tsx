'use client';

import { useRef, useState } from 'react';

import messages from '@/i18n/messages/ar.json';
import { useAuth } from '@/modules/auth';
import { focusFirstInvalid, mapFieldErrors, validateProfile } from '@/modules/auth-screens';
import { ApiError, getApiErrorMessage } from '@/shared/lib/api';
import { Button } from '@/shared/ui/button';
import { Field } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';

import { updateProfile } from '../api/profile-api';
import styles from './profile.module.css';

const fieldOrder = ['fullName', 'phone'] as const;

// PUT /me with the fields the API allows: name and phone. The language is sent back unchanged (the English switch is
// not live); the email has its own form. The answer replaces the signed-in user, so the header shows the new name.
export function ProfileForm() {
  const text = messages.account;
  const { setUser, user } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState({
    fullName: user?.fullName ?? '',
    phone: user?.phone ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [alert, setAlert] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) {
    return null;
  }

  const change = (field: keyof typeof values, value: string) => {
    setValues({ ...values, [field]: value });
    setIsSaved(false);
  };

  const submit = async () => {
    if (isSubmitting) {
      return;
    }

    const found = validateProfile(values, messages.auth);
    setErrors(found);

    if (focusFirstInvalid(formRef.current, fieldOrder, found)) {
      return;
    }

    setAlert('');
    setIsSaved(false);
    setIsSubmitting(true);

    try {
      const phone = values.phone.trim();
      const saved = await updateProfile({
        name: values.fullName.trim(),
        phone: phone || null,
        preferredLanguage: user.preferredLanguage,
      });
      setUser(saved);
      setValues({ fullName: saved.fullName, phone: saved.phone ?? '' });
      setIsSaved(true);
    } catch (error) {
      if (error instanceof ApiError) {
        const fields = mapFieldErrors(error, ['name', 'phone']);
        const serverErrors = { fullName: fields.name, phone: fields.phone };

        setErrors(serverErrors);
        setAlert(getApiErrorMessage(error));
        focusFirstInvalid(formRef.current, fieldOrder, serverErrors);
      } else {
        setAlert(messages.apiErrors.generic);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section aria-labelledby="profile-section" className={styles.card}>
      <h2 id="profile-section">{text.profileSection}</h2>
      <form
        className={styles.form}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        ref={formRef}
      >
        <Field error={errors.fullName} label={text.name} required>
          <Input
            autoComplete="name"
            disabled={isSubmitting}
            name="fullName"
            onChange={(event) => change('fullName', event.target.value)}
            value={values.fullName}
          />
        </Field>
        <Field error={errors.phone} label={text.phone}>
          <Input
            autoComplete="tel"
            dir="ltr"
            disabled={isSubmitting}
            inputMode="tel"
            name="phone"
            onChange={(event) => change('phone', event.target.value)}
            type="tel"
            value={values.phone}
          />
        </Field>
        <div className={styles.actions}>
          <Button loading={isSubmitting} onClick={() => void submit()}>
            {text.save}
          </Button>
        </div>
        <p
          className={alert ? `${styles.status} ${styles.statusError}` : styles.status}
          role={alert ? 'alert' : 'status'}
        >
          {alert || (isSaved ? text.saved : '')}
        </p>
      </form>
    </section>
  );
}
