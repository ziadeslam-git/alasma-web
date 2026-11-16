import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { axe } from '@/test/axe';

import { SafeImage, type SafeImageProps } from './safe-image';

// @ts-expect-error Non-decorative images require alt text.
const invalidImage: SafeImageProps = { height: 100, src: '/cover.jpg', width: 100 };
void invalidImage;

describe('SafeImage', () => {
  it('shows a placeholder when src is missing', () => {
    render(<SafeImage alt="Cover" aspectRatio="2 / 3" fill />);

    expect(screen.getByRole('img', { name: 'Cover' })).toBeInTheDocument();
  });

  it('shows a placeholder after an image error', () => {
    const { container } = render(
      <SafeImage alt="Cover" src="/cover.jpg" width={100} height={150} />,
    );
    const image = container.querySelector('img');

    expect(image).toBeInTheDocument();
    fireEvent.error(image as HTMLImageElement);
    expect(screen.getByRole('img', { name: 'Cover' })).toBeInTheDocument();
  });

  it('tells the parent once when the image fails to load', () => {
    const onError = vi.fn();
    const { container } = render(
      <SafeImage alt="Cover" height={150} onError={onError} src="/cover.jpg" width={100} />,
    );

    fireEvent.error(container.querySelector('img') as HTMLImageElement);

    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('renders decorative images with empty alt text and hidden semantics', () => {
    const { container } = render(
      <SafeImage decorative src="/cover.jpg" width={100} height={150} />,
    );
    const image = container.querySelector('img');

    expect(image).toHaveAttribute('alt', '');
    expect(image).toHaveAttribute('aria-hidden', 'true');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<SafeImage alt="Cover" aspectRatio="2 / 3" fill />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
