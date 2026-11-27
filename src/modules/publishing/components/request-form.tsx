'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from 'react';

import messages from '@/i18n/messages/ar.json';
import { UnconfirmedEmailBanner } from '@/modules/account';
import { useAuth } from '@/modules/auth';
import { routes } from '@/shared/config/routes';
import { ApiError, getApiErrorMessage } from '@/shared/lib/api';
import { formatNumber } from '@/shared/lib/format';
import { Button, ButtonLink } from '@/shared/ui/button';
import { Icon } from '@/shared/ui/icon';
import { Input, Select, Textarea } from '@/shared/ui/input';

import {
  getManuscriptTypes,
  submitPackageRequest,
  type ManuscriptType,
  type PackageGroup,
} from '../api/publishing-api';
import {
  MANUSCRIPT_ACCEPT,
  NOTES_MAX_LENGTH,
  SYNOPSIS_MAX_LENGTH,
  validatePackageRequest,
  type PackageRequestIssues,
} from '../schemas/package-request-validation';
import { packageSelection } from '../state/package-selection';
import styles from './publishing.module.css';

type Phase = 'form' | 'done';

function submitErrorMessage(cause: unknown): string {
  const text = messages.publishing.form;
  if (!(cause instanceof ApiError)) return text.submitError;
  const base = getApiErrorMessage(cause);
  if (cause.status === 429 && cause.retryAfterSeconds !== undefined) {
    return `${base} ${text.retryAfter.replace('{seconds}', formatNumber(cause.retryAfterSeconds))}`;
  }
  return base;
}

// The request form (design .rq): a customer sends a manuscript for a package. A visitor is asked to sign in first.
export function RequestForm({ groups }: { groups: readonly PackageGroup[] }) {
  const text = messages.publishing.form;
  const errors = messages.publishing.errors;
  const { status, user } = useAuth();
  const chosen = useSyncExternalStore(
    packageSelection.subscribe,
    packageSelection.getSnapshot,
    packageSelection.getServerSnapshot,
  );
  const fileInput = useRef<HTMLInputElement>(null);
  const [types, setTypes] = useState<readonly ManuscriptType[]>([]);
  const [hasTypesFailed, setHasTypesFailed] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [phone, setPhone] = useState('');
  const [packageId, setPackageId] = useState<number | null>(null);
  const [typeId, setTypeId] = useState<number | null>(null);
  const [workTitle, setWorkTitle] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [issues, setIssues] = useState<PackageRequestIssues>({});
  const [submitError, setSubmitError] = useState('');
  const [isUnconfirmed, setUnconfirmed] = useState(false);
  const [isPending, setPending] = useState(false);
  const [phase, setPhase] = useState<Phase>('form');

  useEffect(() => {
    if (status !== 'authenticated') return;
    let isActive = true;
    void getManuscriptTypes()
      .then((result) => {
        if (isActive) setTypes(result);
      })
      .catch(() => {
        if (isActive) setHasTypesFailed(true);
      });
    return () => {
      isActive = false;
    };
  }, [status]);

  // A package chosen on a card wins over the select until the visitor changes the select.
  const selectedPackage = packageId ?? chosen;

  const packages = groups.flatMap((group) =>
    group.packages.map((item) => ({ id: item.id, label: `${group.section.name} · ${item.title}` })),
  );

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    if (isPending) return;
    const found = validatePackageRequest({
      authorName,
      phone,
      packageId: selectedPackage,
      manuscriptTypeId: typeId,
      workTitle,
      synopsis,
      notes,
      file,
    });
    setIssues(found);
    setSubmitError('');
    setUnconfirmed(false);
    if (Object.keys(found).length > 0 || selectedPackage === null || typeId === null || !file) {
      return;
    }
    setPending(true);
    try {
      await submitPackageRequest({
        packageId: selectedPackage,
        authorName,
        phone,
        workTitle,
        manuscriptTypeId: typeId,
        synopsis,
        notes,
        file,
      });
      setPhase('done');
    } catch (cause) {
      if (cause instanceof ApiError && cause.code === 'email_not_confirmed') setUnconfirmed(true);
      else setSubmitError(submitErrorMessage(cause));
    } finally {
      setPending(false);
    }
  }

  function reset() {
    setAuthorName('');
    setPhone('');
    setPackageId(null);
    setTypeId(null);
    setWorkTitle('');
    setSynopsis('');
    setNotes('');
    setFile(null);
    setIssues({});
    setPhase('form');
  }

  const issueText = (key: keyof PackageRequestIssues) => {
    const issue = issues[key];
    return issue ? errors[issue] : '';
  };

  function renderError(key: keyof PackageRequestIssues, id: string) {
    const message = issueText(key);
    return message ? (
      <span className={styles.fieldError} id={id} role="alert">
        {message}
      </span>
    ) : null;
  }

  let body;
  if (status === 'anonymous') {
    body = (
      <div className={styles.formNote}>
        <p>{text.guest}</p>
        <ButtonLink href={`${routes.login}?next=${encodeURIComponent(`${routes.publish}#req`)}`}>
          {text.login}
        </ButtonLink>
      </div>
    );
  } else if (status === 'loading') {
    body = <div aria-busy="true" className={styles.formNote} />;
  } else if (phase === 'done') {
    body = (
      <div className={styles.formNote} role="status">
        <h3 className={styles.successTitle}>{text.successTitle}</h3>
        <p>{text.successText}</p>
        <Button onClick={reset} variant="outline">
          {text.sendAnother}
        </Button>
      </div>
    );
  } else {
    body = (
      <form className={styles.form} noValidate onSubmit={(event) => void submit(event)}>
        <div className={styles.fieldBox}>
          <label className={styles.label}>
            {text.fullName}
            <Input
              aria-describedby={issues.authorName ? 'rq-name-error' : undefined}
              aria-invalid={issues.authorName ? true : undefined}
              autoComplete="name"
              disabled={isPending}
              onChange={(event) => setAuthorName(event.target.value)}
              placeholder={text.fullNamePlaceholder}
              type="text"
              value={authorName}
            />
          </label>
          {renderError('authorName', 'rq-name-error')}
        </div>
        <div className={styles.fieldBox}>
          <label className={styles.label}>
            {text.phone}
            <Input
              aria-describedby={issues.phone ? 'rq-phone-error' : undefined}
              aria-invalid={issues.phone ? true : undefined}
              autoComplete="tel"
              dir="ltr"
              disabled={isPending}
              inputMode="tel"
              onChange={(event) => setPhone(event.target.value)}
              placeholder={text.phonePlaceholder}
              type="tel"
              value={phone}
            />
          </label>
          {renderError('phone', 'rq-phone-error')}
        </div>
        <div className={`${styles.fieldBox} ${styles.full}`}>
          <label className={styles.label}>
            {text.email}
            <Input dir="ltr" readOnly type="email" value={user?.email ?? ''} />
          </label>
        </div>
        <div className={styles.fieldBox}>
          <label className={styles.label}>
            {text.package}
            <Select
              aria-describedby={issues.packageId ? 'rq-package-error' : undefined}
              aria-invalid={issues.packageId ? true : undefined}
              disabled={isPending}
              onChange={(event) =>
                setPackageId(event.target.value ? Number(event.target.value) : null)
              }
              value={selectedPackage ?? ''}
            >
              <option value="">{text.packagePlaceholder}</option>
              {packages.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </Select>
          </label>
          {renderError('packageId', 'rq-package-error')}
        </div>
        <div className={styles.fieldBox}>
          <label className={styles.label}>
            {text.type}
            <Select
              aria-describedby={issues.manuscriptTypeId ? 'rq-type-error' : undefined}
              aria-invalid={issues.manuscriptTypeId ? true : undefined}
              disabled={isPending}
              onChange={(event) =>
                setTypeId(event.target.value ? Number(event.target.value) : null)
              }
              value={typeId ?? ''}
            >
              <option value="">{text.typePlaceholder}</option>
              {types.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </label>
          {hasTypesFailed ? <span className={styles.fieldError}>{text.typesLoadError}</span> : null}
          {renderError('manuscriptTypeId', 'rq-type-error')}
        </div>
        <div className={`${styles.fieldBox} ${styles.full}`}>
          <label className={styles.label}>
            {text.workTitle}
            <Input
              aria-describedby={issues.workTitle ? 'rq-title-error' : undefined}
              aria-invalid={issues.workTitle ? true : undefined}
              disabled={isPending}
              onChange={(event) => setWorkTitle(event.target.value)}
              type="text"
              value={workTitle}
            />
          </label>
          {renderError('workTitle', 'rq-title-error')}
        </div>
        <div className={`${styles.fieldBox} ${styles.full}`}>
          <label className={styles.label}>
            {text.synopsis}
            <Textarea
              aria-describedby={issues.synopsis ? 'rq-synopsis-error' : undefined}
              aria-invalid={issues.synopsis ? true : undefined}
              disabled={isPending}
              maxLength={SYNOPSIS_MAX_LENGTH + 500}
              onChange={(event) => setSynopsis(event.target.value)}
              placeholder={text.synopsisPlaceholder}
              value={synopsis}
            />
          </label>
          {renderError('synopsis', 'rq-synopsis-error')}
        </div>
        <div className={`${styles.fieldBox} ${styles.full}`}>
          <label className={styles.label}>
            {text.notes}
            <Textarea
              aria-describedby={issues.notes ? 'rq-notes-error' : undefined}
              aria-invalid={issues.notes ? true : undefined}
              disabled={isPending}
              maxLength={NOTES_MAX_LENGTH + 500}
              onChange={(event) => setNotes(event.target.value)}
              value={notes}
            />
          </label>
          {renderError('notes', 'rq-notes-error')}
        </div>
        <div className={`${styles.label} ${styles.full}`}>
          <label htmlFor="rq-file">{text.file}</label>
          <div
            aria-hidden="true"
            className={styles.drop}
            onClick={() => fileInput.current?.click()}
          >
            <Icon name="plus" size="sm" />
            <span>{file ? text.fileChosen.replace('{name}', file.name) : text.dropHint}</span>
          </div>
          <input
            accept={MANUSCRIPT_ACCEPT}
            aria-describedby={issues.file ? 'rq-file-error' : undefined}
            aria-invalid={issues.file ? true : undefined}
            className={styles.fileInput}
            disabled={isPending}
            id="rq-file"
            ref={fileInput}
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            type="file"
          />
          {renderError('file', 'rq-file-error')}
        </div>
        {isUnconfirmed ? <UnconfirmedEmailBanner /> : null}
        {submitError ? (
          <p className={`${styles.fieldError} ${styles.full}`} role="alert">
            {submitError}
          </p>
        ) : null}
        <div className={styles.full}>
          <Button
            fullWidth
            loading={isPending}
            onClick={() => void submit()}
            size="lg"
            trailingIcon="arrow"
          >
            {isPending ? text.submitting : text.submit}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <section aria-labelledby="req-heading" className={styles.request} id="req">
      <div className={styles.requestSide}>
        <h2 id="req-heading">{text.title}</h2>
        <p>{text.lead}</p>
        <ul>
          {[text.point1, text.point2, text.point3].map((point) => (
            <li key={point}>
              <Icon name="check" size="sm" />
              {point}
            </li>
          ))}
        </ul>
      </div>
      {body}
    </section>
  );
}
