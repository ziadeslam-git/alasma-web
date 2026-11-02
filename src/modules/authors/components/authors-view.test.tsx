import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import messages from '@/i18n/messages/ar.json';
import { axe } from '@/test/axe';
import { AuthorsView } from './authors-view';
describe('authors list', () => {
  it('shows an accessible neutral empty state', async () => {
    const { container } = render(<AuthorsView data={null} page={1} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      messages.site.header.authors,
    );
    expect(screen.getByText(messages.authors.emptyTitle)).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
