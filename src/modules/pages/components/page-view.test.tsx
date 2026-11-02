import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { axe } from '@/test/axe';
import { PageView } from './page-view';

it('renders the title and does not render body of unconfirmed format', async () => {
  const { container } = render(
    <PageView page={{ key: 'about', title: 'Title', body: '<b>body</b>' }} />,
  );
  expect(screen.getByRole('heading', { level: 1, name: 'Title' })).toBeVisible();
  expect(container.querySelector('b')).toBeNull();
  expect(container).not.toHaveTextContent('<b>body</b>');
  expect(await axe(container)).toHaveNoViolations();
});

it('renders plain paragraphs and entity-like text literally', () => {
  const { container } = render(
    <PageView page={{ key: 'about', title: 'Title', body: 'First\nline\n\nA &amp; B' }} />,
  );
  const paragraphs = container.querySelectorAll('article > p');
  expect(paragraphs).toHaveLength(2);
  expect(paragraphs[1]).toHaveTextContent('A &amp; B');
  expect(container.querySelector('a[href^="http"]')).toBeNull();
});
