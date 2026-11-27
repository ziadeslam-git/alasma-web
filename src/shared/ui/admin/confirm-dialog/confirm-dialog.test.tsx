import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { axe } from '@/test/axe';

import { ConfirmDialog, type ConfirmDialogProps } from './confirm-dialog';

const copy = messages.admin.confirm;

function Harness(
  props: Partial<ConfirmDialogProps> & { onConfirm?: ConfirmDialogProps['onConfirm'] },
) {
  const [isOpen, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} type="button">
        opener
      </button>
      <ConfirmDialog
        confirmLabel="Do it"
        description="Are you sure"
        onConfirm={() => undefined}
        onOpenChange={setOpen}
        open={isOpen}
        title="Title"
        {...props}
      />
    </>
  );
}

function openDialog() {
  const opener = screen.getByRole('button', { name: 'opener' });

  act(() => opener.focus());
  fireEvent.click(opener);

  return opener;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ConfirmDialog', () => {
  it('renders an alertdialog with title and description and has no axe violations', async () => {
    const { baseElement } = render(<Harness />);

    openDialog();

    expect(await screen.findByRole('alertdialog', { name: 'Title' })).toHaveAccessibleDescription(
      'Are you sure',
    );
    expect(await axe(baseElement)).toHaveNoViolations();
  });

  it('confirm runs onConfirm and closes; cancel closes without running it', async () => {
    const onConfirm = vi.fn();

    render(<Harness onConfirm={onConfirm} />);
    openDialog();
    fireEvent.click(await screen.findByRole('button', { name: copy.cancel }));

    expect(onConfirm).not.toHaveBeenCalled();

    openDialog();
    fireEvent.click(await screen.findByRole('button', { name: 'Do it' }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
  });

  it('a double click runs the action once and the button is busy while it runs', async () => {
    let finish: () => void = () => undefined;
    const onConfirm = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));

    render(<Harness onConfirm={onConfirm} tone="danger" />);
    openDialog();

    const confirm = await screen.findByRole('button', { name: 'Do it' });

    fireEvent.click(confirm);
    fireEvent.click(confirm);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(confirm).toBeDisabled();
    expect(confirm).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: copy.cancel })).toBeDisabled();

    await act(async () => finish());
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  });

  it('keeps the dialog open with an error when the action fails, and allows a retry', async () => {
    const onConfirm = vi
      .fn()
      .mockRejectedValueOnce(new Error('x'))
      .mockResolvedValueOnce(undefined);

    render(<Harness onConfirm={onConfirm} />);
    openDialog();
    fireEvent.click(await screen.findByRole('button', { name: 'Do it' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(copy.failed);

    fireEvent.click(screen.getByRole('button', { name: 'Do it' }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(2));
  });

  it('returns focus to the button that opened it', async () => {
    render(<Harness />);

    const opener = openDialog();

    fireEvent.click(await screen.findByRole('button', { name: copy.cancel }));

    await waitFor(() => expect(opener).toHaveFocus());
  });

  it('keeps focus inside: Tab on the last control wraps to the first, Shift+Tab the other way', async () => {
    vi.spyOn(Element.prototype, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList);
    render(<Harness />);
    openDialog();

    const dialog = await screen.findByRole('alertdialog');
    const buttons = Array.from(dialog.querySelectorAll('button'));
    const first = buttons[0] as HTMLButtonElement;
    const last = buttons[buttons.length - 1] as HTMLButtonElement;

    act(() => last.focus());
    fireEvent.keyDown(dialog, { key: 'Tab' });

    expect(first).toHaveFocus();

    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });

    expect(last).toHaveFocus();
  });

  describe('reason', () => {
    it('required: confirm stays disabled until there is a reason, with a counter and the 500 max', async () => {
      const onConfirm = vi.fn();

      render(<Harness onConfirm={onConfirm} reason={{ label: 'Reason', mode: 'required' }} />);
      openDialog();

      const confirm = await screen.findByRole('button', { name: 'Do it' });
      const field = screen.getByRole('textbox');

      expect(confirm).toBeDisabled();
      expect(field).toHaveAttribute('maxlength', '500');
      expect(screen.getByText('0 من 500')).toBeInTheDocument();
      expect(screen.getByText(copy.reasonRequired)).toBeInTheDocument();

      fireEvent.change(field, { target: { value: '   ' } });

      expect(confirm).toBeDisabled();

      fireEvent.change(field, { target: { value: '  late delivery ' } });

      expect(screen.getByText('16 من 500')).toBeInTheDocument();
      expect(confirm).toBeEnabled();

      fireEvent.click(confirm);

      await waitFor(() => expect(onConfirm).toHaveBeenCalledWith('late delivery'));
    });

    it('optional: confirm works with no text, and a custom max is used', async () => {
      const onConfirm = vi.fn();

      render(
        <Harness
          onConfirm={onConfirm}
          reason={{ label: 'Reason', maxLength: 50, mode: 'optional' }}
        />,
      );
      openDialog();

      expect(await screen.findByRole('textbox')).toHaveAttribute('maxlength', '50');
      expect(screen.getByText('0 من 50')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Do it' }));

      await waitFor(() => expect(onConfirm).toHaveBeenCalledWith(''));
    });

    it('clears the reason when the dialog is cancelled and opened again', async () => {
      render(<Harness reason={{ label: 'Reason', mode: 'required' }} />);
      openDialog();
      fireEvent.change(await screen.findByRole('textbox'), { target: { value: 'abc' } });
      fireEvent.click(screen.getByRole('button', { name: copy.cancel }));
      openDialog();

      expect(await screen.findByRole('textbox')).toHaveValue('');
    });
  });
});
