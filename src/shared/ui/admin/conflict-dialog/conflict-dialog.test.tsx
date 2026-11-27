import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { axe } from '@/test/axe';

import { ConflictDialog, type ConflictField } from './conflict-dialog';
import { keepMineWithFreshVersion } from './resolve-conflict';

const copy = messages.admin.conflict;

const FIELDS: ConflictField[] = [
  { key: 'title', label: 'Title', server: 'Server title', yours: 'My title' },
  { key: 'stock', label: 'Stock', server: '35', yours: '40' },
];

function Harness({
  fields = FIELDS,
  onKeepMine = () => undefined,
  onLoadServer = () => undefined,
}: {
  fields?: ConflictField[];
  onKeepMine?: () => Promise<void> | void;
  onLoadServer?: () => Promise<void> | void;
}) {
  const [isOpen, setOpen] = useState(true);

  return (
    <>
      <span>{isOpen ? 'is-open' : 'is-closed'}</span>
      <ConflictDialog
        fields={fields}
        onKeepMine={onKeepMine}
        onLoadServer={onLoadServer}
        onOpenChange={setOpen}
        open={isOpen}
      />
    </>
  );
}

describe('ConflictDialog', () => {
  it('shows each differing field with yours and the server value, and has no axe violations', async () => {
    render(<Harness />);

    const dialog = await screen.findByRole('alertdialog', { name: copy.title });
    const row = within(dialog).getByRole('row', { name: /Title/ });

    expect(within(row).getByText('My title')).toBeInTheDocument();
    expect(within(row).getByText('Server title')).toBeInTheDocument();
    expect(within(dialog).getByRole('columnheader', { name: copy.yours })).toBeInTheDocument();
    expect(await axe(dialog)).toHaveNoViolations();
  });

  it('says so when there is nothing to compare', async () => {
    render(<Harness fields={[]} />);

    expect(await screen.findByText(copy.noFields)).toBeInTheDocument();
  });

  it('"load the new version" calls onLoadServer only, then closes', async () => {
    const onLoadServer = vi.fn();
    const onKeepMine = vi.fn();

    render(<Harness onKeepMine={onKeepMine} onLoadServer={onLoadServer} />);
    fireEvent.click(await screen.findByRole('button', { name: copy.loadServer }));

    await waitFor(() => expect(screen.getByText('is-closed')).toBeInTheDocument());
    expect(onLoadServer).toHaveBeenCalledTimes(1);
    expect(onKeepMine).not.toHaveBeenCalled();
  });

  it('"keep mine" calls onKeepMine only, then closes', async () => {
    const onLoadServer = vi.fn();
    const onKeepMine = vi.fn();

    render(<Harness onKeepMine={onKeepMine} onLoadServer={onLoadServer} />);
    fireEvent.click(await screen.findByRole('button', { name: copy.keepMine }));

    await waitFor(() => expect(screen.getByText('is-closed')).toBeInTheDocument());
    expect(onKeepMine).toHaveBeenCalledTimes(1);
    expect(onLoadServer).not.toHaveBeenCalled();
  });

  it('cancel closes and calls neither', async () => {
    const onLoadServer = vi.fn();
    const onKeepMine = vi.fn();

    render(<Harness onKeepMine={onKeepMine} onLoadServer={onLoadServer} />);
    fireEvent.click(await screen.findByRole('button', { name: copy.cancel }));

    await waitFor(() => expect(screen.getByText('is-closed')).toBeInTheDocument());
    expect(onLoadServer).not.toHaveBeenCalled();
    expect(onKeepMine).not.toHaveBeenCalled();
  });

  it('blocks a second choice while one runs (no double submit)', async () => {
    let finish: () => void = () => undefined;
    const onKeepMine = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    const onLoadServer = vi.fn();

    render(<Harness onKeepMine={onKeepMine} onLoadServer={onLoadServer} />);

    const keep = await screen.findByRole('button', { name: copy.keepMine });

    fireEvent.click(keep);
    fireEvent.click(keep);
    fireEvent.click(screen.getByRole('button', { name: copy.loadServer }));

    expect(onKeepMine).toHaveBeenCalledTimes(1);
    expect(onLoadServer).not.toHaveBeenCalled();

    await act(async () => finish());
  });

  it('stays open with an error when the chosen action fails', async () => {
    render(<Harness onKeepMine={() => Promise.reject(new Error('x'))} />);
    fireEvent.click(await screen.findByRole('button', { name: copy.keepMine }));

    expect(await screen.findByRole('alert')).toHaveTextContent(copy.failed);
    expect(screen.getByText('is-open')).toBeInTheDocument();
  });
});

describe('keepMineWithFreshVersion', () => {
  it('saves with the rowVersion fetched NOW, not the stale one, and in that order', async () => {
    const calls: string[] = [];
    const fetchLatest = vi.fn(async () => {
      calls.push('fetch');

      return { rowVersion: 'NEW==', title: 'server' };
    });
    const save = vi.fn(async (rowVersion: string) => {
      calls.push(`save:${rowVersion}`);
    });

    await keepMineWithFreshVersion(fetchLatest, save);

    expect(calls).toEqual(['fetch', 'save:NEW==']);
    expect(save).toHaveBeenCalledWith('NEW==', { rowVersion: 'NEW==', title: 'server' });
  });

  it('does not bypass validation: a save error (422 or a second conflict) is thrown to the caller', async () => {
    const failure = new Error('validation');

    await expect(
      keepMineWithFreshVersion(
        async () => ({ rowVersion: 'N' }),
        async () => {
          throw failure;
        },
      ),
    ).rejects.toBe(failure);
  });

  it('never saves when the fresh copy cannot be fetched', async () => {
    const save = vi.fn();

    await expect(
      keepMineWithFreshVersion(() => Promise.reject(new Error('404')), save),
    ).rejects.toThrow('404');
    expect(save).not.toHaveBeenCalled();
  });
});
