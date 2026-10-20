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
});
