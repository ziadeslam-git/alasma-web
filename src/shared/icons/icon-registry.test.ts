import { describe, expect, it } from 'vitest';

import { iconRegistry, type IconName } from './icon-registry';

describe('icon registry', () => {
  it('contains a safe, renderable definition for every icon name', () => {
    for (const name of Object.keys(iconRegistry) as IconName[]) {
      const icon = iconRegistry[name];

      expect(icon.body).not.toHaveLength(0);
      expect(icon.viewBox).not.toHaveLength(0);
      expect(icon.body).not.toContain('#');
      expect(icon.body.toLowerCase()).not.toContain('<script');
    }
  });
});
