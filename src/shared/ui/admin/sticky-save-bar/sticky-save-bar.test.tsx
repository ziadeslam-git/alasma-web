import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { axe } from '@/test/axe';

import { StickySaveBar } from './sticky-save-bar';
import { UnsavedChangesGuard } from './unsaved-changes-guard';
import { getLeavingHref } from './use-unsaved-changes-guard';

const bar = messages.admin.saveBar;
const leave = messages.admin.leave;
const nav = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: nav.push }) }));

describe('StickySaveBar', () => {
  it('renders nothing when there are no changes', () => {
    const { container } = render(
      <StickySaveBar isDirty={false} onRevert={vi.fn()} onSave={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('shows save and revert when dirty, and calls them', async () => {
    const onSave = vi.fn();
    const onRevert = vi.fn();
    const { container } = render(<StickySaveBar isDirty onRevert={onRevert} onSave={onSave} />);

    expect(screen.getByRole('region', { name: bar.label })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(bar.unsaved);

    fireEvent.click(screen.getByRole('button', { name: bar.save }));
    fireEvent.click(screen.getByRole('button', { name: bar.revert }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onRevert).toHaveBeenCalledTimes(1);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('while saving: both buttons are disabled and save cannot run twice', () => {
    const onSave = vi.fn();
    const onRevert = vi.fn();

    render(<StickySaveBar isDirty isSaving onRevert={onRevert} onSave={onSave} />);

    expect(screen.getByRole('status')).toHaveTextContent(bar.saving);

    const save = screen.getByRole('button', { name: bar.save });

    expect(save).toBeDisabled();
    expect(save).toHaveAttribute('aria-busy', 'true');

    fireEvent.click(save);
    fireEvent.click(screen.getByRole('button', { name: bar.revert }));

    expect(onSave).not.toHaveBeenCalled();
    expect(onRevert).not.toHaveBeenCalled();
  });
});

describe('getLeavingHref', () => {
  // The jsdom location: anchors resolve their href against it, so the origins match like in a browser.
  const current = {
    href: window.location.href,
    origin: window.location.origin,
    pathname: window.location.pathname,
    search: window.location.search,
  };

  function click(href: string, init: MouseEventInit = {}, attrs: Record<string, string> = {}) {
    const anchor = document.createElement('a');

    anchor.setAttribute('href', href);
    Object.entries(attrs).forEach(([key, value]) => anchor.setAttribute(key, value));
    document.body.append(anchor);

    let result: string | null = null;

    // Evaluated while the event is dispatched (as the guard does), then the navigation jsdom cannot do is cancelled.
    anchor.addEventListener('click', (event) => {
      result = getLeavingHref(event, current);
      event.preventDefault();
    });
    anchor.dispatchEvent(
      new MouseEvent('click', { bubbles: true, button: 0, cancelable: true, ...init }),
    );
    anchor.remove();

    return result;
  }

  it('returns the in-app destination of a plain link click', () => {
    expect(click('/admin/orders?page=2#x')).toBe('/admin/orders?page=2#x');
  });

  it('ignores same-page links, anchors, other origins, new-tab and modified clicks, downloads', () => {
    expect(click(`${current.pathname}${current.search}`)).toBeNull();
    expect(click('#section')).toBeNull();
    expect(click('https://example.com/x')).toBeNull();
    expect(click('/admin/orders', {}, { target: '_blank' })).toBeNull();
    expect(click('/admin/orders', { ctrlKey: true })).toBeNull();
    expect(click('/admin/orders', { button: 1 })).toBeNull();
    expect(click('/file.pdf', {}, { download: '' })).toBeNull();
  });
});

describe('UnsavedChangesGuard', () => {
  beforeEach(() => {
    nav.push.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function Page({ isDirty }: { isDirty: boolean }) {
    return (
      <>
        <a href="orders">orders</a>
        <UnsavedChangesGuard isDirty={isDirty} />
      </>
    );
  }

  it('does not interfere while nothing is dirty', () => {
    render(<Page isDirty={false} />);

    const event = new MouseEvent('click', { bubbles: true, button: 0, cancelable: true });
    let isPrevented = true;

    document.addEventListener(
      'click',
      (clicked) => {
        isPrevented = clicked.defaultPrevented;
        clicked.preventDefault();
      },
      { once: true },
    );
    screen.getByRole('link', { name: 'orders' }).dispatchEvent(event);

    expect(isPrevented).toBe(false);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('asks the browser before a reload/close while dirty (beforeunload)', () => {
    render(<Page isDirty />);

    const event = new Event('beforeunload', { cancelable: true });

    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it('does not ask the browser once the changes are saved', () => {
    const { rerender } = render(<Page isDirty />);

    rerender(<Page isDirty={false} />);

    const event = new Event('beforeunload', { cancelable: true });

    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
  });

  it('holds an in-app link click and asks; "stay" keeps the page', async () => {
    render(<Page isDirty />);
    fireEvent.click(screen.getByRole('link', { name: 'orders' }));

    expect(await screen.findByRole('alertdialog', { name: leave.title })).toBeInTheDocument();
    expect(nav.push).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: leave.stay }));

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(nav.push).not.toHaveBeenCalled();
  });

  it('"leave" navigates to the link that was clicked', async () => {
    render(<Page isDirty />);
    fireEvent.click(screen.getByRole('link', { name: 'orders' }));
    fireEvent.click(await screen.findByRole('button', { name: leave.leave }));

    await waitFor(() => expect(nav.push).toHaveBeenCalledWith('/orders'));
    await act(async () => undefined);
  });
});
