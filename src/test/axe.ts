import { configureAxe } from 'vitest-axe';

// jsdom has no layout or canvas, so axe cannot compute colour contrast here; contrast is checked by the
// Playwright axe run in a real browser.
export const axe = configureAxe({
  rules: { 'color-contrast': { enabled: false } },
});
