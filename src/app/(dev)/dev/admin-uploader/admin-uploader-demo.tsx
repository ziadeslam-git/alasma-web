'use client';

import { useState } from 'react';

import messages from '@/i18n/messages/ar.json';
import { ApiError } from '@/shared/lib/api';
import { getAdminErrorMessage, mapApiError } from '@/shared/lib/api/admin';
import {
  openProtectedDocument,
  openSignedUrl,
  ProtectedDocumentPopupBlockedError,
  UnsafeSignedUrlError,
} from '@/shared/lib/open-protected-document';
import { Button } from '@/shared/ui/button';
import { ImageUploader, type ImageUploadContext } from '@/shared/ui/admin/image-uploader';

import styles from './admin-uploader-demo.module.css';

const copy = messages.devAdminUploader;
const STEP_MS = 400;
const STEPS = 10;
const RATE_LIMIT_SECONDS = 30;
const DEMO_DOCUMENT = '<!doctype html><meta charset="utf-8"><title>demo</title><p>demo</p>';
const DEMO_LINK_PATH = '/dev/admin-uploader';

// Mock handlers only: nothing here talks to a server.
function slowUpload(_file: File, { signal, onProgress }: ImageUploadContext): Promise<void> {
  return new Promise((resolve, reject) => {
    let step = 0;
    const timer = window.setInterval(() => {
      step += 1;
      onProgress((step / STEPS) * 100);
      if (step >= STEPS) {
        window.clearInterval(timer);
        resolve();
      }
    }, STEP_MS);

    signal.addEventListener('abort', () => {
      window.clearInterval(timer);
      reject(new DOMException('aborted', 'AbortError'));
    });
  });
}

function rateLimited(): Promise<void> {
  return Promise.reject(
    new ApiError({ kind: 'problem', status: 429, retryAfterSeconds: RATE_LIMIT_SECONDS }),
  );
}

function invalidFile(): Promise<void> {
  return Promise.reject(
    new ApiError({ kind: 'problem', status: 400, code: 'payment_proof_file_invalid' }),
  );
}

export function AdminUploaderDemo() {
  const [documentError, setDocumentError] = useState<string | null>(null);

  const run = async (action: () => Promise<void>) => {
    setDocumentError(null);
    try {
      await action();
    } catch (cause) {
      if (cause instanceof ProtectedDocumentPopupBlockedError) {
        setDocumentError(messages.admin.document.popupBlocked);
      } else if (cause instanceof UnsafeSignedUrlError) {
        setDocumentError(messages.admin.document.unsafeLink);
      } else {
        setDocumentError(getAdminErrorMessage(mapApiError(cause).messageKey));
      }
    }
  };

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>{copy.title}</h1>

      <section className={styles.panel}>
        <h2 className={styles.heading}>{copy.normal}</h2>
        <ImageUploader label={copy.coverLabel} onUpload={slowUpload} />
      </section>

      <section className={styles.panel}>
        <h2 className={styles.heading}>{copy.rateLimited}</h2>
        <ImageUploader label={copy.coverLabel} onUpload={rateLimited} />
      </section>

      <section className={styles.panel}>
        <h2 className={styles.heading}>{copy.serverRejects}</h2>
        <ImageUploader label={copy.coverLabel} onUpload={invalidFile} />
      </section>

      <section className={styles.panel}>
        <h2 className={styles.heading}>{copy.disabled}</h2>
        <ImageUploader isDisabled label={copy.coverLabel} onUpload={slowUpload} />
      </section>

      <section className={styles.panel}>
        <h2 className={styles.heading}>{copy.documents}</h2>
        <div className={styles.row}>
          <Button
            variant="outline"
            onClick={() => run(() => openProtectedDocument(() => Promise.resolve(DEMO_DOCUMENT)))}
          >
            {copy.openDocument}
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              run(() =>
                openSignedUrl(() =>
                  Promise.resolve({ url: `${window.location.origin}${DEMO_LINK_PATH}` }),
                ),
              )
            }
          >
            {copy.openSigned}
          </Button>
        </div>
        {documentError !== null ? <p role="alert">{documentError}</p> : null}
      </section>
    </main>
  );
}
