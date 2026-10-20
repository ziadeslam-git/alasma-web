import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { axe } from '@/test/axe';

import { Button, type ButtonProps } from './button';

// @ts-expect-error Icon-only buttons require a label in their public type.
const invalidIconOnlyButton: ButtonProps = { leadingIcon: 'search' };
void invalidIconOnlyButton;

describe('Button', () => {
  it('renders a button with the safe default type and handles clicks', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick}>Save</Button>);

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('type', 'button');
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('ignores disabled and loading clicks', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <>
        <Button disabled onClick={onClick}>
          Disabled
        </Button>
        <Button loading onClick={onClick}>
          Loading
        </Button>
      </>,
    );

    await user.click(screen.getByRole('button', { name: 'Disabled' }));
    await user.click(screen.getByRole('button', { name: 'Loading' }));

    expect(screen.getByRole('button', { name: 'Loading' })).toHaveAttribute('aria-busy', 'true');
    expect(onClick).not.toHaveBeenCalled();
  });

  it('activates with Enter and Space', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick}>Continue</Button>);

    await user.tab();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');

    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Button leadingIcon="search">Search</Button>);

    expect(await axe(container)).toHaveNoViolations();
  });
});
