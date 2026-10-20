import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';

import { ExampleButton } from './example-button';

// EXAMPLE (task F1.6): component test with a keyboard interaction and an axe check.
describe('example button', () => {
  it('calls the handler when pressed with the keyboard', async () => {
    const onPress = vi.fn();
    render(<ExampleButton onPress={onPress}>أضف إلى السلة</ExampleButton>);

    await userEvent.tab();
    await userEvent.keyboard('{Enter}');

    expect(screen.getByRole('button', { name: 'أضف إلى السلة' })).toHaveFocus();
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <ExampleButton onPress={() => undefined}>أضف إلى السلة</ExampleButton>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
