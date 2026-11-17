import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import ErrorPage from './error';

describe('ErrorPage', () => {
  it('retries without exposing the error message and displays the digest', async () => {
    const reset = vi.fn();
    const user = userEvent.setup();
    render(
      <ErrorPage error={Object.assign(new Error('private'), { digest: 'abc' })} reset={reset} />,
    );
    await user.click(screen.getByRole('button'));
    expect(reset).toHaveBeenCalledOnce();
    expect(screen.queryByText('private')).not.toBeInTheDocument();
    expect(screen.getByText(/abc/)).toBeInTheDocument();
  });

  // The root boundary cannot rebuild the shell, but the page keeps one <main> and one <h1> (Task 75).
  it('renders one main and one h1', () => {
    render(<ErrorPage error={new Error('x')} reset={() => {}} />);
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });
});
