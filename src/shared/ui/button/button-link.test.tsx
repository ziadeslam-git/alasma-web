import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ButtonLink } from './button-link';

describe('ButtonLink', () => {
  it('uses Next Link for internal paths', () => {
    render(<ButtonLink href="/catalog">Catalog</ButtonLink>);

    expect(screen.getByRole('link', { name: 'Catalog' })).toHaveAttribute('href', '/catalog');
  });

  it('uses a safe plain anchor for external paths', () => {
    render(<ButtonLink href="https://example.com">External</ButtonLink>);

    expect(screen.getByRole('link', { name: 'External' })).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    );
  });
});
