'use client';

import { useState, type FormEvent } from 'react';

import messages from '@/i18n/messages/ar.json';
import { UnconfirmedEmailBanner } from '@/modules/account';
import { ApiError, getApiErrorMessage } from '@/shared/lib/api';
import { formatNumber } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Field } from '@/shared/ui/field';
import { Icon } from '@/shared/ui/icon';
import { Input } from '@/shared/ui/input';
import { Modal } from '@/shared/ui/modal';
import { FeatureGate } from '@/shared/ui/soon';

import {
  createReview,
  REVIEW_COMMENT_MAX_LENGTH,
  REVIEW_MAX_RATING,
  REVIEW_MIN_RATING,
} from '../api/reviews-api';
import { ReviewCommentField } from './review-comment-field';
import styles from './reviews.module.css';

const STAR_VALUES = Array.from(
  { length: REVIEW_MAX_RATING - REVIEW_MIN_RATING + 1 },
  (_, index) => REVIEW_MIN_RATING + index,
);

type Phase = 'form' | 'done';

export function ReviewFormModal({ bookId, onClose }: { bookId: number; onClose: () => void }) {
  const text = messages.reviews;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [phase, setPhase] = useState<Phase>('form');
  const [isPending, setPending] = useState(false);
  const [ratingError, setRatingError] = useState('');
  const [commentError, setCommentError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isUnconfirmed, setUnconfirmed] = useState(false);

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    if (isPending) return;
    const hasValidRating = rating >= REVIEW_MIN_RATING && rating <= REVIEW_MAX_RATING;
    const hasValidComment = comment.length <= REVIEW_COMMENT_MAX_LENGTH;
    setRatingError(hasValidRating ? '' : text.ratingRequired);
    setCommentError(
      hasValidComment
        ? ''
        : text.commentTooLong.replace('{max}', formatNumber(REVIEW_COMMENT_MAX_LENGTH)),
    );
    setSubmitError('');
    setUnconfirmed(false);
    if (!hasValidRating || !hasValidComment) return;

    setPending(true);
    try {
      const trimmed = comment.trim();
      await createReview(bookId, { rating, comment: trimmed === '' ? null : trimmed });
      setPhase('done');
    } catch (cause) {
      if (cause instanceof ApiError && cause.code === 'email_not_confirmed') setUnconfirmed(true);
      else setSubmitError(cause instanceof ApiError ? getApiErrorMessage(cause) : text.submitError);
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal
      closeLabel={text.close}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      open
      title={phase === 'done' ? text.successTitle : text.modalTitle}
    >
      {phase === 'done' ? (
        <div className={styles.success}>
          <p role="status">{text.successText}</p>
          <div className={styles.actions}>
            <Button data-autofocus onClick={onClose}>
              {text.close}
            </Button>
          </div>
        </div>
      ) : (
        <form className={styles.form} noValidate onSubmit={(event) => void submit(event)}>
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>{text.ratingLabel}</legend>
            <div className={styles.starInput}>
              {STAR_VALUES.map((value) => (
                <label
                  className={`${styles.starOption} ${value <= rating ? styles.starOptionOn : ''}`}
                  key={value}
                >
                  <input
                    aria-label={text.starOption.replace('{count}', formatNumber(value))}
                    checked={rating === value}
                    className={styles.starRadio}
                    name="rating"
                    onChange={() => setRating(value)}
                    type="radio"
                    value={value}
                  />
                  <Icon name="sparkle" size="lg" />
                </label>
              ))}
            </div>
            {ratingError ? (
              <p className={styles.formError} role="alert">
                {ratingError}
              </p>
            ) : null}
          </fieldset>

          <FeatureGate badge="inline" feature="review-title" label={messages.site.soon}>
            <Field label={text.titleLabel}>
              <Input disabled placeholder={text.titlePlaceholder} />
            </Field>
          </FeatureGate>

          <ReviewCommentField error={commentError} onChange={setComment} value={comment} />

          <p className={styles.note}>{text.pendingNote}</p>

          {isUnconfirmed ? <UnconfirmedEmailBanner /> : null}
          {submitError ? (
            <p className={styles.formError} role="alert">
              {submitError}
            </p>
          ) : null}

          <div className={styles.actions}>
            <Button disabled={isPending} onClick={onClose} variant="outline">
              {text.cancel}
            </Button>
            <Button loading={isPending} onClick={() => void submit()}>
              {isPending ? text.submitting : text.submit}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
