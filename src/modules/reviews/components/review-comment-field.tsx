'use client';

import messages from '@/i18n/messages/ar.json';
import { formatNumber } from '@/shared/lib/format';
import { Field } from '@/shared/ui/field';
import { useFieldContext } from '@/shared/ui/field/field-context';

import { REVIEW_COMMENT_MAX_LENGTH } from '../api/reviews-api';
import styles from './reviews.module.css';

function CommentTextarea({
  onChange,
  value,
}: {
  onChange: (value: string) => void;
  value: string;
}) {
  const field = useFieldContext();
  const isInvalid = Boolean(field?.error);
  return (
    <textarea
      aria-describedby={field?.describedBy}
      aria-invalid={isInvalid || undefined}
      className={isInvalid ? `${styles.textarea} ${styles.textareaInvalid}` : styles.textarea}
      id={field?.id}
      onChange={(event) => onChange(event.target.value)}
      placeholder={messages.reviews.commentPlaceholder}
      value={value}
    />
  );
}

// The comment is optional; the API accepts at most 2000 characters, so the counter shows the limit.
export function ReviewCommentField({
  error,
  onChange,
  value,
}: {
  error: string;
  onChange: (value: string) => void;
  value: string;
}) {
  const text = messages.reviews;
  return (
    <Field
      error={error || undefined}
      hint={text.counter
        .replace('{count}', formatNumber(value.length))
        .replace('{max}', formatNumber(REVIEW_COMMENT_MAX_LENGTH))}
      label={text.commentLabel}
    >
      <CommentTextarea onChange={onChange} value={value} />
    </Field>
  );
}
