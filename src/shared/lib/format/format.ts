import messages from '@/i18n/messages/ar.json';

const integerFormatter = new Intl.NumberFormat('ar-EG', {
  numberingSystem: 'latn',
  maximumFractionDigits: 0,
});

const decimalFormatter = new Intl.NumberFormat('ar-EG', {
  numberingSystem: 'latn',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

// Formats a number with Western Arabic digits (0-9) as used across the Al-Asma design boards.
export function formatNumber(value: number): string {
  return Number.isInteger(value) ? integerFormatter.format(value) : decimalFormatter.format(value);
}

// Formats a final API price with the currency unit (e.g. "120 ج.م"). Never computes or alters prices.
export function formatMoney(amount: number, currency: string = messages.catalog.currency): string {
  return `${formatNumber(amount)} ${currency}`;
}

// Formats a discount percentage badge from the API value (e.g. "خصم 20%").
export function formatDiscountBadge(
  percent: number,
  template: string = messages.catalog.discountBadge,
): string {
  return template.replace('{percent}', formatNumber(percent));
}
