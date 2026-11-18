import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AuthorAvatar, getAuthorInitials } from './author-avatar';

describe('getAuthorInitials', () => {
  it('takes the first letter of the first two words', () => {
    expect(getAuthorInitials('أحمد سليمان')).toBe('أس');
    // a leading article "ال" is skipped, so the letter that tells the names apart is shown
    expect(getAuthorInitials('منى الراوي الحكيم')).toBe('مر');
    expect(getAuthorInitials('Ada Lovelace')).toBe('AL');
  });

  it('handles one word, extra spaces and nothing', () => {
    expect(getAuthorInitials('مها')).toBe('م');
    expect(getAuthorInitials('  خالد   حمدان  ')).toBe('خح');
    expect(getAuthorInitials('   ')).toBe('');
  });

  it('ignores Arabic diacritics so the letter is shown alone', () => {
    expect(getAuthorInitials('أَحْمَد سُلَيْمَان')).toBe('أس');
  });
});

describe('AuthorAvatar', () => {
  it('shows decorative initials when there is no photo', () => {
    const { container } = render(<AuthorAvatar name="أحمد سليمان" photoUrl={null} size={180} />);
    const initials = container.querySelector('[data-author-initials]')!;
    expect(initials).toHaveTextContent('أس');
    expect(initials).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('shows the photo, named after the author, when there is one', () => {
    const { container } = render(<AuthorAvatar name="أحمد سليمان" photoUrl="/a.jpg" size={180} />);
    expect(container.querySelector('[data-author-initials]')).toBeNull();
    expect(container.querySelector('img')).toBeInTheDocument();
  });

  it('hides the photo from assistive technology when it is decorative (inside a link that names the author)', () => {
    const { container } = render(
      <AuthorAvatar decorative name="أحمد سليمان" photoUrl="/a.jpg" size={180} />,
    );
    const image = container.querySelector('img')!;
    expect(image).toHaveAttribute('alt', '');
    expect(image).toHaveAttribute('aria-hidden', 'true');
  });
});
