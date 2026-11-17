import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import messages from '@/i18n/messages/ar.json';
import { axe } from '@/test/axe';
import { AuthorsView } from './authors-view';

const refresh = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));

describe('authors list', () => {
  it('shows an accessible neutral empty state for an empty list', async () => {
    const { container } = render(
      <AuthorsView
        page={1}
        result={{ status: 'ok', data: { items: [], page: 1, pageSize: 48, totalCount: 0 } }}
      />,
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      messages.site.header.authors,
    );
    expect(screen.getByText(messages.authors.emptyTitle)).toBeInTheDocument();
    expect(screen.queryByText(messages.authors.errorTitle)).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows an error state with a working retry when the list failed to load (Task 67)', async () => {
    const user = userEvent.setup();
    const { container } = render(<AuthorsView page={1} result={{ status: 'error' }} />);
    expect(screen.getByText(messages.authors.errorTitle)).toBeInTheDocument();
    expect(screen.queryByText(messages.authors.emptyTitle)).toBeNull();
    await user.click(screen.getByRole('button', { name: messages.site.loadError.retry }));
    expect(refresh).toHaveBeenCalledOnce();
    expect(await axe(container)).toHaveNoViolations();
  });
});
