import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { axe } from '@/test/axe';
import { Button } from '@/shared/ui/button';

import { EmptyState } from './empty-state';

describe('EmptyState', () => {
  it('uses the requested heading level and renders its action slot', () => {
    render(
      <EmptyState
        action={<Button>Retry</Button>}
        description="Try again later"
        headingLevel={3}
        icon="help"
        title="Failed"
        variant="error"
      />,
    );

    expect(screen.getByRole('heading', { level: 3, name: 'Failed' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('renders no default content without caller-supplied text', () => {
    const { container } = render(<EmptyState description="" icon="package" title="" />);

    expect(container.textContent).toBe('');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <EmptyState description="Try again later" icon="package" title="Nothing here" />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
