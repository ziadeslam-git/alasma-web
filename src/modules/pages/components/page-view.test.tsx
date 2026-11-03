import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { axe } from '@/test/axe';
import { PageView } from './page-view';

it('renders the title and sanitized markup in the body', async () => {
  const { container } = render(
    <PageView page={{ key: 'about', title: 'Title', body: '<p><b>body</b></p><h1>inner</h1>' }} />,
  );
  expect(screen.getByRole('heading', { level: 1, name: 'Title' })).toBeVisible();
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  expect(container.querySelector('b')).toHaveTextContent('body');
  expect(screen.getByRole('heading', { level: 2, name: 'inner' })).toBeVisible();
  expect(await axe(container)).toHaveNoViolations();
});

it('does not run a script placed in the body', () => {
  const { container } = render(
    <PageView
      page={{ key: 'about', title: 'Title', body: '<script>alert(1)</script><p>ok</p>' }}
    />,
  );
  expect(container.querySelector('script')).toBeNull();
  expect(container).toHaveTextContent('ok');
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

it('shows the empty state for an empty body', () => {
  render(<PageView page={{ key: 'about', title: 'Title', body: '' }} />);
  expect(screen.getByRole('heading', { level: 2 })).toBeVisible();
});
