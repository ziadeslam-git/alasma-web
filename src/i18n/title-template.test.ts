import { describe, expect, it } from 'vitest';

import messages from './messages/ar.json';

// The root layout's title template is "%s | <site name>", so a page title must not contain the site name itself, or the
// site name shows twice in the browser tab (Task 79: "<site> | الرئيسية | <site>").
describe('page titles and the title template', () => {
  const siteName = messages.seo.siteName;

  it('the template adds the site name once', () => {
    expect(messages.seo.titleTemplate).toBe(`%s | ${siteName}`);
    expect(messages.seo.defaultTitle).toBe(siteName);
  });

  it('no page title message already contains the site name', () => {
    const pageTitles: Record<string, string> = {
      'home.meta.title': messages.home.meta.title,
      'catalog.page.meta.title': messages.catalog.page.meta.title,
      'seo.authorsTitle': messages.seo.authorsTitle,
      'seo.categoriesTitle': messages.seo.categoriesTitle,
    };
    for (const [key, value] of Object.entries(pageTitles)) {
      expect(value.includes(siteName), `${key} = ${value}`).toBe(false);
    }
  });
});
