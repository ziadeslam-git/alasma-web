import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { axe } from '@/test/axe';

import { MobileNavMenu } from './mobile-nav-menu';

describe('MobileNavMenu', () => {
  it('opens and closes its drawer from the labelled trigger', async () => {
    const user = userEvent.setup();
    render(
      <MobileNavMenu closeLabel="Close menu" label="Menu" title="Menu">
        <p>Menu content</p>
      </MobileNavMenu>,
    );

    await user.click(screen.getByRole('button', { name: 'Menu' }));
    expect(screen.getByRole('dialog', { name: 'Menu' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close menu' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders the footer slot inside the drawer, after the content (Task 84)', async () => {
    const user = userEvent.setup();
    render(
      <MobileNavMenu
        closeLabel="Close menu"
        footer={<button type="button">Menu footer</button>}
        label="Menu"
        title="Menu"
      >
        <p>Menu content</p>
      </MobileNavMenu>,
    );
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    const dialog = screen.getByRole('dialog', { name: 'Menu' });
    const content = within(dialog).getByText('Menu content');
    const footer = within(dialog).getByRole('button', { name: 'Menu footer' });

    expect(content.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('has no accessibility violations when open', async () => {
    const user = userEvent.setup();
    render(
      <MobileNavMenu closeLabel="Close menu" label="Menu" title="Menu">
        <p>Menu content</p>
      </MobileNavMenu>,
    );
    await user.click(screen.getByRole('button', { name: 'Menu' }));

    expect(await axe(document.body)).toHaveNoViolations();
  });
});
