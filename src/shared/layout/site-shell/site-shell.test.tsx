import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SiteShell } from './site-shell';

describe('SiteShell', () => {
  it('renders exactly one main landmark with the children inside it', () => {
    render(
      <SiteShell>
        <p>Page content</p>
      </SiteShell>,
    );

    const main = screen.getByRole('main');

    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(main).toHaveAttribute('id', 'main-content');
    expect(main).toContainElement(screen.getByText('Page content'));
  });
});
