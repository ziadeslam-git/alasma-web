import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import GlobalError from './global-error';

describe('GlobalError', () => {
  // It replaces the root layout (<html> and <body>), so it is rendered to markup here.
  it('has one main and one h1, and shows the reference in its own element', () => {
    const html = renderToStaticMarkup(
      <GlobalError error={Object.assign(new Error('x'), { digest: '99' })} reset={() => {}} />,
    );

    expect(html.match(/<main/g)).toHaveLength(1);
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain('data-error-reference');
  });
});
