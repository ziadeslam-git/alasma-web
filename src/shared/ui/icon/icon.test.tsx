import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { axe } from '@/test/axe';

import { Icon } from './icon';
import styles from './icon.module.css';

describe('Icon', () => {
  it('renders a decorative svg at the requested size', () => {
    const { container } = render(<Icon name="search" size="sm" />);
    const icon = container.querySelector('svg');

    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon).toHaveAttribute('focusable', 'false');
    expect(icon).toHaveClass(styles.sizeSmall ?? '');
  });

  it('renders a labelled image for assistive technology', () => {
    render(<Icon label="Search" name="search" />);

    expect(screen.getByRole('img', { name: 'Search' })).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Icon label="Search" name="search" />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
