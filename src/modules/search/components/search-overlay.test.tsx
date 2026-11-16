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

  it('has a round open button for small screens and a styled "all results" submit once results show', async () => {
    render(<SearchOverlay />);
    fireEvent.click(screen.getByRole('button', { name: messages.search.open }));
    const dialog = await screen.findByRole('dialog', { name: messages.search.title });

    expect(within(dialog).queryByRole('button', { name: messages.search.allResults })).toBeNull();
    fireEvent.change(within(dialog).getByRole('combobox'), { target: { value: 'book' } });
    const all = await within(dialog).findByRole('button', { name: messages.search.allResults });

    expect(all).toHaveAttribute('type', 'submit');
    expect(all.className).toContain('all');
    expect(all.getAttribute('form')).toBe(within(dialog).getByRole('search').id);
  });

  it('opens the book when a result row is clicked and closes the dialog', async () => {
    navigate.mockClear();
    render(<SearchOverlay />);
    fireEvent.click(screen.getByRole('button', { name: messages.search.open }));
    const dialog = await screen.findByRole('dialog', { name: messages.search.title });
    fireEvent.change(within(dialog).getByRole('combobox'), { target: { value: 'book' } });
    fireEvent.click(await within(dialog).findByRole('option'));

    expect(navigate).toHaveBeenCalledWith('/books/book');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('submits the typed query to the results page from the "all results" button', async () => {
    render(<SearchOverlay />);
    fireEvent.click(screen.getByRole('button', { name: messages.search.open }));
    const dialog = await screen.findByRole('dialog', { name: messages.search.title });
    const input = within(dialog).getByRole('combobox');
    fireEvent.change(input, { target: { value: 'book' } });
    const all = await within(dialog).findByRole('button', { name: messages.search.allResults });

    const form = (all as HTMLButtonElement).form!;
    expect(form).toHaveAttribute('action', '/books');
    expect(form.method).toBe('get');
    expect(new FormData(form).get('q')).toBe('book');
  });
});
