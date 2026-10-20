import { describe, expect, it } from 'vitest';

import { clamp } from './clamp-example';

// EXAMPLE (task F1.6): unit test shape.
describe('clamp example', () => {
  it('keeps a value inside the range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('limits a value to the bounds', () => {
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(42, 0, 10)).toBe(10);
  });
});
