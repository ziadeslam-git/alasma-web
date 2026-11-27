'use client';

import { useState } from 'react';

import messages from '@/i18n/messages/ar.json';
import { CmsHtml } from '@/modules/pages';
import { ApiError } from '@/shared/lib/api';
import {
  DateInput,
  FormBanner,
  isoDate,
  maxItems,
  maxLength,
  MoneyInput,
  MultiSelect,
  numberRange,
  required,
  RichHtmlField,
  useAdminForm,
  type FormSchema,
} from '@/shared/ui/admin/form';
import { Button } from '@/shared/ui/button';
import { Field } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';

import styles from './admin-form-demo.module.css';

const copy = messages.devAdminForm;
const MAX_CODE = 50;
const MAX_AUTHORS = 3;
const MAX_DISCOUNT = 100_000;

type DemoValues = {
  code: string;
  discount: number | null;
  endsAt: string;
  authors: string[];
  body: string;
};

type Mode = 'ok' | 'fields' | 'banner';

const SCHEMA: FormSchema<DemoValues> = {
  code: [required(), maxLength(MAX_CODE)],
  discount: [required(), numberRange(0.01, MAX_DISCOUNT)],
  endsAt: [isoDate()],
  authors: [maxItems(MAX_AUTHORS)],
};

const INITIAL: DemoValues = { code: '', discount: null, endsAt: '', authors: [], body: '' };
const AUTHOR_OPTIONS = copy.authorNames.map((label, index) => ({
  label,
  value: String(index + 1),
}));

// Mock server only: nothing here talks to a real API.
function mockSubmit(mode: Mode): Promise<void> {
  if (mode === 'fields') {
    return Promise.reject(
      new ApiError({
        kind: 'problem',
        status: 400,
        errors: { Code: [copy.fieldCode], Discount: [copy.fieldDiscount], Nope: [copy.fieldCode] },
      }),
    );
  }
  if (mode === 'banner') {
    return Promise.reject(
      new ApiError({ kind: 'problem', status: 422, code: 'invalid_state_transition' }),
    );
  }

  return Promise.resolve();
}

export function AdminFormDemo() {
  const [mode, setMode] = useState<Mode>('ok');
  const [isSaved, setIsSaved] = useState(false);
  const form = useAdminForm<DemoValues>({
    initialValues: INITIAL,
    schema: SCHEMA,
    onSubmit: async () => {
      setIsSaved(false);
      await mockSubmit(mode);
      setIsSaved(true);
    },
  });
  const { errors, setValue, values } = form;

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>{copy.title}</h1>

      <form className={styles.panel} noValidate onSubmit={form.handleSubmit}>
        <FormBanner message={form.formError} />

        <Field error={errors.code} label={copy.code} required>
          <Input value={values.code} onChange={(event) => setValue('code', event.target.value)} />
        </Field>

        <Field error={errors.discount} label={copy.discount} required>
          <MoneyInput value={values.discount} onChange={(value) => setValue('discount', value)} />
        </Field>

        <Field error={errors.endsAt} label={copy.endsAt}>
          <DateInput
            isEndOfDay
            mode="date"
            value={values.endsAt}
            onChange={(value) => setValue('endsAt', value)}
          />
        </Field>

        <Field error={errors.authors} label={copy.authors}>
          <MultiSelect
            maxSelected={MAX_AUTHORS}
            options={AUTHOR_OPTIONS}
            value={values.authors}
            onChange={(value) => setValue('authors', value)}
          />
        </Field>

        <Field label={copy.body}>
          <RichHtmlField
            renderPreview={(html) => <CmsHtml body={html} />}
            value={values.body}
            onChange={(value) => setValue('body', value)}
          />
        </Field>

        {isSaved ? <p role="status">{copy.saved}</p> : null}

        <div className={styles.row}>
          <Button loading={form.isSubmitting} type="submit" variant="primary">
            {copy.save}
          </Button>
          <Button variant="outline" onClick={() => setMode('fields')}>
            {copy.serverFields}
          </Button>
          <Button variant="outline" onClick={() => setMode('banner')}>
            {copy.serverBanner}
          </Button>
        </div>
      </form>
    </main>
  );
}
