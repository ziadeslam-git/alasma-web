import 'vitest';
import type { AxeMatchers } from 'vitest-axe/matchers';

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- merges the axe matchers into the Vitest types
  interface Assertion extends AxeMatchers {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- same merge for the asymmetric matchers
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}
