import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ComponentType } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { axe } from '@/test/axe';

import { Drawer, type DrawerProps } from '@/shared/ui/drawer';
import { Modal, type ModalProps } from '@/shared/ui/modal';

import { DRAWER_EXIT_DURATION, MODAL_EXIT_DURATION } from './overlay-constants';

type OverlayProps = Pick<
  ModalProps & DrawerProps,
  | 'children'
  | 'closeLabel'
  | 'closeOnBackdrop'
  | 'closeOnEscape'
  | 'defaultOpen'
  | 'description'
  | 'onOpenChange'
  | 'open'
  | 'role'
  | 'title'
>;

const closeLabel = 'Close';

// Modal and Drawer share one implementation (OverlayDialog), so the same behaviour is checked on both.
const overlays: [string, ComponentType<OverlayProps>, number][] = [
  ['Modal', Modal, MODAL_EXIT_DURATION],
  ['Drawer', Drawer, DRAWER_EXIT_DURATION],
];

function Bed({
  Overlay,
  onOpenChange,
  ...rest
}: Partial<OverlayProps> & { Overlay: ComponentType<OverlayProps> }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)} type="button">
        Open it
      </button>
      <Overlay
        closeLabel={closeLabel}
        onOpenChange={(next) => {
          setIsOpen(next);
          onOpenChange?.(next);
        }}
        open={isOpen}
        title="Dialog title"
        {...rest}
      >
        <button data-autofocus type="button">
          Inside
        </button>
      </Overlay>
    </>
  );
}

const open = async () => {
  const trigger = screen.getByRole('button', { name: 'Open it' });
  await userEvent.click(trigger);

  return trigger;
};

describe.each(overlays)('%s', (_name, Overlay, exitDuration) => {
  it('renders nothing while closed', () => {
    render(<Bed Overlay={Overlay} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens as a modal dialog labelled by its title and described by its description', async () => {
    render(<Bed Overlay={Overlay} description="Some detail" />);
    await open();

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName('Dialog title');
    expect(dialog).toHaveAccessibleDescription('Some detail');
  });

  it('can be an alertdialog', async () => {
    render(<Bed Overlay={Overlay} role="alertdialog" />);
    await open();

    expect(screen.getByRole('alertdialog')).toHaveAccessibleName('Dialog title');
  });

  it('moves focus to the element marked data-autofocus', async () => {
    render(<Bed Overlay={Overlay} />);
    await open();

    expect(screen.getByRole('button', { name: 'Inside' })).toHaveFocus();
  });

  it('asks to close from the close button', async () => {
    const onOpenChange = vi.fn();
    render(<Bed Overlay={Overlay} onOpenChange={onOpenChange} />);
    await open();

    await userEvent.click(screen.getByRole('button', { name: closeLabel }));

    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('asks to close on Escape (the cancel event) and takes over from the browser', async () => {
    const onOpenChange = vi.fn();
    render(<Bed Overlay={Overlay} onOpenChange={onOpenChange} />);
    await open();
    const cancel = new Event('cancel', { cancelable: true });

    act(() => {
      screen.getByRole('dialog').dispatchEvent(cancel);
    });

    expect(cancel.defaultPrevented).toBe(true);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('ignores Escape when closeOnEscape is false but still stops the browser closing it', async () => {
    const onOpenChange = vi.fn();
    render(<Bed Overlay={Overlay} closeOnEscape={false} onOpenChange={onOpenChange} />);
    await open();
    const cancel = new Event('cancel', { cancelable: true });

    act(() => {
      screen.getByRole('dialog').dispatchEvent(cancel);
    });

    expect(cancel.defaultPrevented).toBe(true);
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it('closes when the backdrop is pressed and released, not when the press started inside', async () => {
    const onOpenChange = vi.fn();
    render(<Bed Overlay={Overlay} onOpenChange={onOpenChange} />);
    await open();
    const dialog = screen.getByRole('dialog');
    const inside = screen.getByRole('button', { name: 'Inside' });

    fireEvent.pointerDown(inside);
    fireEvent.click(dialog);
    expect(onOpenChange).not.toHaveBeenCalledWith(false);

    fireEvent.pointerDown(dialog);
    fireEvent.click(inside);
    expect(onOpenChange).not.toHaveBeenCalledWith(false);

    fireEvent.pointerDown(dialog);
    fireEvent.click(dialog);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('ignores the backdrop when closeOnBackdrop is false', async () => {
    const onOpenChange = vi.fn();
    render(<Bed Overlay={Overlay} closeOnBackdrop={false} onOpenChange={onOpenChange} />);
    await open();
    const dialog = screen.getByRole('dialog');

    fireEvent.pointerDown(dialog);
    fireEvent.click(dialog);

    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it('locks the page scroll while open, and removes the dialog and returns focus after the exit time', async () => {
    render(<Bed Overlay={Overlay} />);
    const trigger = await open();
    expect(document.body.style.overflow).toBe('hidden');

    await userEvent.click(screen.getByRole('button', { name: closeLabel }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument(), {
      timeout: exitDuration * 5,
    });
    // the lock and the focus are released in the effect cleanup, a moment after the dialog leaves the DOM
    await waitFor(() => expect(document.body.style.overflow).toBe(''));
    expect(trigger).toHaveFocus();
  });

  it('removes the dialog at once, with no exit wait, under reduced motion', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({ matches: true, media: query })),
    );
    render(<Bed Overlay={Overlay} />);
    await open();

    await userEvent.click(screen.getByRole('button', { name: closeLabel }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument(), {
      timeout: exitDuration / 2,
    });
    vi.unstubAllGlobals();
  });

  it('works uncontrolled with defaultOpen', async () => {
    render(
      <Overlay closeLabel={closeLabel} defaultOpen title="Own state">
        <p>Body</p>
      </Overlay>,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: closeLabel }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument(), {
      timeout: exitDuration * 5,
    });
  });

  it('has no accessibility violations when open', async () => {
    render(<Bed Overlay={Overlay} description="Some detail" />);
    await open();

    expect(await axe(document.body)).toHaveNoViolations();
  });
});
