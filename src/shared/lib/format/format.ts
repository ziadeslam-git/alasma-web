import messages from '@/i18n/messages/ar.json';

/**
 * Formats a number with Latin digits (0-9) according to the store design specifications:
 * - Deterministic, pure, and server-safe with zero ICU/locale dependencies.
 * - Thousands grouping using comma (',') when absolute value is 1,000 or greater.
 * - Decimal separation using dot ('.') rounded to at most 2 decimal places, with trailing fractional zeros stripped.
 * - Returns '0' for 0, negative zero, NaN, Infinity, or invalid non-finite numbers.
 * - Preserves leading minus sign for negative values (e.g. -1234.5 -> "-1,234.5").
 */
export function formatNumber(value: number): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '0';
  }

  const isNegative = value < 0;
  // Round to at most 2 decimal places to avoid floating-point representation artifacts.
  const rounded = Math.round((Math.abs(value) + Number.EPSILON) * 100) / 100;
  if (rounded === 0) {
    return '0';
  }

  const [intPart = '0', fracPart] = rounded.toString().split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const result = fracPart !== undefined ? `${formattedInt}.${fracPart}` : formattedInt;

  return isNegative ? `-${result}` : result;
}

/**
 * Formats a final API price with Latin digits followed by a space and the currency label (e.g. "120 ج.م").
 * Never computes or alters prices; displays the exact value from the API.
 */
export function formatMoney(amount: number, currency: string = messages.catalog.currency): string {
  return `${formatNumber(amount)} ${currency}`;
}

/**
 * Formats a discount percentage badge from the API value (e.g. "خصم 20%").
 * Substitutes the Latin-digit percentage into the discount badge message template.
 */
export function formatDiscountBadge(
  percent: number,
  template: string = messages.catalog.discountBadge,
): string {
  return template.replace('{percent}', formatNumber(percent));
}
