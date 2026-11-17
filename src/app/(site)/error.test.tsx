import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';

import SiteError from './error';

describe('(site) error', () => {
  it('renders one h1 and no shell of its own, retries, and keeps the reference off the button row', async () => {
    const reset = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <SiteError
        error={Object.assign(new Error('private'), { digest: '53668014' })}
        reset={reset}
      />,
    );

    expect(container.querySelector('header, main, footer')).toBeNull();
    expect(
      screen.getByRole('heading', { level: 1, name: messages.site.footer.errorTitle }),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: messages.site.footer.retry }));
    expect(reset).toHaveBeenCalledOnce();
    expect(screen.queryByText('private')).not.toBeInTheDocument();

    // the reference code is its own element, not inside the row that holds the buttons (Task 75: it overlapped one)
    const reference = container.querySelector('[data-error-reference]')!;
    expect(reference).toHaveTextContent(`${messages.site.footer.reference}: 53668014`);
    for (const control of screen.getAllByRole('button').concat(screen.getAllByRole('link'))) {
      expect(control.parentElement?.contains(reference)).toBe(false);
    }
  });

  it('shows no reference line when the error has no digest', () => {
    const { container } = render(<SiteError error={new Error('x')} reset={() => {}} />);
    expect(container.querySelector('[data-error-reference]')).toBeNull();
  });
});
