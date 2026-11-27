import messages from '@/i18n/messages/ar.json';

import { STATUS_TONES, type StatusTone, type StatusType } from './status-map';
import styles from './status-pill.module.css';

export type StatusPillProps = {
  status: string;
  type: StatusType;
};

const labels: Record<string, Record<string, string> | undefined> = messages.admin.status;

const toneClasses: Record<StatusTone, string> = {
  danger: styles.danger ?? '',
  info: styles.info ?? '',
  neutral: styles.neutral ?? '',
  success: styles.success ?? '',
  warning: styles.warning ?? '',
};

// A value the map does not know (a new enum member from the backend) is shown as a neutral pill with the raw value,
// so a screen never crashes or goes blank because of a status it has not heard of.
export function StatusPill({ status, type }: StatusPillProps) {
  const tone = STATUS_TONES[type][status] ?? 'neutral';
  const label = labels[type]?.[status] ?? status;

  return (
    <span className={`${styles.pill} ${toneClasses[tone]}`} data-tone={tone}>
      {label}
    </span>
  );
}
