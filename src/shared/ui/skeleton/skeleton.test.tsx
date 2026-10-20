import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { axe } from '@/test/axe';

import { Skeleton } from './skeleton';
import styles from './skeleton.module.css';

describe('Skeleton', () => {
  it('marks the loading container busy and its shapes hidden', () => {
    const { container } = render(<Skeleton shape="card" />);

    expect(container.firstElementChild).toHaveAttribute('aria-busy', 'true');
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(3);
  });

  it('uses its non-animated class when motion is reduced', () => {
    const { container } = render(<Skeleton reducedMotion />);

    expect(container.firstElementChild).toHaveClass(styles.reducedMotion ?? '');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Skeleton shape="card" />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
