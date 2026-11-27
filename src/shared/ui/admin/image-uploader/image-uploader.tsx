'use client';

import { useCallback, useEffect, useId, useRef, useState, type ChangeEvent } from 'react';

import messages from '@/i18n/messages/ar.json';
import { getAdminErrorMessage, mapApiError } from '@/shared/lib/api/admin';
import { formatNumber } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Icon } from '@/shared/ui/icon';

import {
  IMAGE_ACCEPTED_TYPES,
  IMAGE_MAX_BYTES,
  validateImageFile,
  type ImageIssue,
} from './image-validation';
import styles from './image-uploader.module.css';

const copy = messages.admin.uploader;
const BYTES_PER_MB = 1024 * 1024;
const MAX_PERCENT = 100;

export const UPLOAD_TIMEOUT_MS = 60_000;

const ISSUE_MESSAGES = {
  type: copy.typeError,
  size: copy.sizeError,
  empty: copy.emptyError,
} as const satisfies Record<ImageIssue, string>;

export type ImageUploadContext = {
  // Aborted by the cancel button, by the timeout, or when the component goes away.
  signal: AbortSignal;
  // 0 to 100. The browser reports upload progress only through XMLHttpRequest, so a caller on fetch may skip it.
  onProgress: (percent: number) => void;
};

export type ImageUploaderProps = {
  label: string;
  onUpload: (file: File, context: ImageUploadContext) => Promise<void>;
  acceptedTypes?: readonly string[];
  // The image that is stored now, shown until a new file is picked.
  currentImageUrl?: string;
  isDisabled?: boolean;
  maxBytes?: number;
  onUploaded?: () => void;
};

type Stage = 'idle' | 'ready' | 'uploading' | 'done';

function formatRetry(seconds: number): string {
  return copy.retryAfter.replace('{seconds}', formatNumber(seconds));
}

// Picks one image, shows it locally, checks type and size before anything is sent, then uploads it with a visible
// progress, a cancel button and a 60 second limit. The object URL of the preview is revoked when the file changes and
// when the component unmounts.
export function ImageUploader({
  label,
  onUpload,
  acceptedTypes = IMAGE_ACCEPTED_TYPES,
  currentImageUrl,
  isDisabled = false,
  maxBytes = IMAGE_MAX_BYTES,
  onUploaded,
}: ImageUploaderProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isInFlightRef = useRef(false);
  const isCancelledRef = useRef(false);
  const isTimedOutRef = useRef(false);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [percent, setPercent] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl !== null) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const isUploading = stage === 'uploading';
  const maxMb = formatNumber(Math.round(maxBytes / BYTES_PER_MB));

  const handlePick = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0];

    event.target.value = '';
    if (!picked) return;

    const issue = validateImageFile(picked, { maxBytes, acceptedTypes });

    if (issue !== null) {
      setFile(null);
      setPreviewUrl(null);
      setStage('idle');
      setError(ISSUE_MESSAGES[issue]);

      return;
    }

    setFile(picked);
    setPreviewUrl(URL.createObjectURL(picked));
    setStage('ready');
    setPercent(0);
    setError(null);
  };

  const fail = useCallback((cause: unknown) => {
    const mapped = mapApiError(cause);
    const text = getAdminErrorMessage(mapped.messageKey);

    setError(
      mapped.kind === 'rate_limited' && mapped.retryAfter !== undefined
        ? `${text} ${formatRetry(mapped.retryAfter)}`
        : text,
    );
    setStage('ready');
  }, []);

  const handleUpload = async () => {
    if (!file || isInFlightRef.current) return;

    isInFlightRef.current = true;
    isCancelledRef.current = false;
    isTimedOutRef.current = false;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      isTimedOutRef.current = true;
      controller.abort();
    }, UPLOAD_TIMEOUT_MS);

    abortRef.current = controller;
    setError(null);
    setPercent(0);
    setStage('uploading');

    try {
      await onUpload(file, {
        signal: controller.signal,
        onProgress: (value) => setPercent(Math.min(MAX_PERCENT, Math.max(0, Math.round(value)))),
      });
      setStage('done');
      onUploaded?.();
    } catch (cause) {
      if (isTimedOutRef.current) {
        setError(messages.admin.uploader.timeout);
        setStage('ready');
      } else if (isCancelledRef.current) {
        setError(null);
        setStage('ready');
      } else {
        fail(cause);
      }
    } finally {
      window.clearTimeout(timer);
      abortRef.current = null;
      isInFlightRef.current = false;
    }
  };

  const handleCancel = () => {
    isCancelledRef.current = true;
    abortRef.current?.abort();
  };

  const shownUrl = previewUrl ?? currentImageUrl ?? null;

  return (
    <div className={styles.root}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>

      <div className={styles.zone} data-state={stage}>
        {shownUrl === null ? (
          // A mouse shortcut to the same file input. Keyboard and screen reader users use the named button below.
          <button
            aria-hidden="true"
            className={styles.empty}
            disabled={isDisabled || isUploading}
            tabIndex={-1}
            type="button"
            onClick={() => inputRef.current?.click()}
          >
            <Icon name="plus" size="lg" />
            <span>{copy.empty}</span>
          </button>
        ) : (
          // The preview is a local Blob URL or an already stored image: next/image cannot optimize either.
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={copy.previewAlt} className={styles.preview} src={shownUrl} />
        )}
      </div>

      <input
        ref={inputRef}
        accept={acceptedTypes.join(',')}
        aria-describedby={`${inputId}-hint`}
        className={styles.input}
        disabled={isDisabled || isUploading}
        id={inputId}
        tabIndex={-1}
        type="file"
        onChange={handlePick}
      />

      <p className={styles.hint} id={`${inputId}-hint`}>
        {copy.hint.replace('{size}', maxMb)}
      </p>

      {isUploading ? (
        <div className={styles.progressRow}>
          <progress
            aria-label={copy.progressLabel}
            className={styles.progress}
            max={MAX_PERCENT}
            value={percent}
          />
          <span className={styles.percent}>{`${formatNumber(percent)}%`}</span>
        </div>
      ) : null}

      {error !== null ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      {stage === 'done' ? (
        <p className={styles.success} role="status">
          {copy.done}
        </p>
      ) : null}

      <div className={styles.actions}>
        <Button
          disabled={isDisabled || isUploading}
          variant="outline"
          onClick={() => inputRef.current?.click()}
        >
          {file === null ? copy.pick : copy.replace}
        </Button>

        {isUploading ? (
          <Button variant="ghost" onClick={handleCancel}>
            {copy.cancel}
          </Button>
        ) : (
          <Button
            disabled={isDisabled || file === null || stage === 'done'}
            variant="primary"
            onClick={handleUpload}
          >
            {copy.upload}
          </Button>
        )}
      </div>
    </div>
  );
}
