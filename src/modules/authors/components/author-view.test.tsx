import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { axe } from '@/test/axe';
import { AuthorView } from './author-view';
it('renders author details and an accessible heading', async () => {
  const author = {
    id: 1,
    name: 'Author',
    slug: 'author',
    photoUrl: null,
    shortBio: null,
    fullBio: 'Biography',
    socialLinks: null,
    books: [],
  };
  const { container } = render(
    <AuthorView author={author}>
      <p>Books</p>
    </AuthorView>,
  );
  expect(screen.getByRole('heading', { level: 1, name: 'Author' })).toBeVisible();
  expect(screen.getByText('Biography')).toBeVisible();
  expect(await axe(container)).toHaveNoViolations();
});
