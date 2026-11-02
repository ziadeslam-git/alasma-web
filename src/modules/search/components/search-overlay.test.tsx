import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';

const navigate = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: navigate }) }));
vi.mock('../api/get-suggestions', () => ({
  getSuggestions: vi.fn().mockResolvedValue([{ title: 'Book', slug: 'book', coverImageUrl: null }]),
}));
import { SearchOverlay } from './search-overlay';

describe('SearchOverlay', () => {
  it('offers a no-script GET form and keyboard selection in the modal', async () => {
    render(<SearchOverlay />);
    expect(screen.getByRole('search')).toHaveAttribute('action', '/books');
    const trigger = screen.getByRole('searchbox', { name: messages.site.search.label });
    fireEvent.keyDown(trigger, { key: 'Enter' });
    const dialog = await screen.findByRole('dialog', { name: messages.search.title });
    const input = within(dialog).getByRole('combobox');
    fireEvent.change(input, { target: { value: 'book' } });
    await waitFor(() => expect(within(dialog).getByRole('option')).toBeInTheDocument());
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(within(dialog).getByRole('option')).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(navigate).toHaveBeenCalledWith('/books/book');
  });
});
