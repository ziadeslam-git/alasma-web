import messages from '@/i18n/messages/ar.json';

const formatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Africa/Cairo',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hourCycle: 'h23',
});

function partsOf(value: string | number | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return undefined;
  return Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
}

export function formatDate(value: string | number | Date): string {
  const parts = partsOf(value);
  if (!parts) return '—';
  const month = messages.dateFormat.months[Number(parts.month) - 1];
  return month ? `${parts.day} ${month} ${parts.year}` : '—';
}

export function formatDateTime(value: string | number | Date): string {
  const parts = partsOf(value);
  if (!parts) return '—';
  const hour = Number(parts.hour);
  return `${formatDate(value)}${messages.dateFormat.separator}${hour % 12 || 12}:${parts.minute} ${hour < 12 ? messages.dateFormat.am : messages.dateFormat.pm}`;
}
