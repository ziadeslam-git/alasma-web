import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { JsonLd, serializeJsonLd } from './json-ld';

describe('JsonLd and serializeJsonLd', () => {
  it('escapes <, >, &, U+2028 and U+2029 as unicode escapes and never emits a raw </script', () => {
    const payload = {
      '@context': 'https://schema.org',
      '@type': 'Book',
      name: '</script><script>alert("xss")</script> & \u2028 \u2029',
    };

    const raw = serializeJsonLd(payload);
    expect(raw.toLowerCase()).not.toContain('</script');
    expect(raw).not.toContain('<');
    expect(raw).not.toContain('>');
    expect(raw).not.toContain('&');
    expect(raw).not.toContain('\u2028');
    expect(raw).not.toContain('\u2029');
    expect(raw).toContain('\\u003c/script\\u003e');
    expect(raw).toContain('\\u0026');
    expect(raw).toContain('\\u2028');
    expect(raw).toContain('\\u2029');
    expect(JSON.parse(raw)).toEqual(payload);
  });

  it('renders an application/ld+json script tag whose innerHTML is safely escaped', () => {
    const { container } = render(
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Al-Asma </script><img src=x onerror=alert(1)>',
        }}
      />,
    );

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    expect(script?.innerHTML.toLowerCase()).not.toContain('</script');
    expect(script?.innerHTML).not.toContain('<');
    expect(JSON.parse(script?.innerHTML ?? '{}')).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Al-Asma </script><img src=x onerror=alert(1)>',
    });
  });
});
