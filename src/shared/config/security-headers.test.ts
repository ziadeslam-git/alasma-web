import { describe, expect, it } from 'vitest';

import { CLOUDINARY_CLOUD_NAME } from './cloudinary';
import { buildCspReportOnlyHeader, buildSecurityHeaders } from './security-headers';

describe('securityHeaders', () => {
  it('exports the expected Cloudinary cloud name', () => {
    expect(CLOUDINARY_CLOUD_NAME).toBe('grethdhn');
  });

  it('includes every baseline security header in development and omits HSTS', () => {
    const headers = buildSecurityHeaders({ isProduction: false });
    const byKey = Object.fromEntries(headers.map((header) => [header.key, header.value]));

    expect(byKey['X-Content-Type-Options']).toBe('nosniff');
    expect(byKey['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(byKey['X-Frame-Options']).toBe('DENY');
    expect(byKey['Permissions-Policy']).toBe(
      'camera=(), microphone=(), geolocation=(), payment=()',
    );
    expect(byKey['Cross-Origin-Opener-Policy']).toBe('same-origin');
    expect(byKey['Strict-Transport-Security']).toBeUndefined();
    expect(byKey['Content-Security-Policy-Report-Only']).toContain("'unsafe-eval'");
  });

  it('includes HSTS in production and never includes unsafe-eval in CSP', () => {
    const headers = buildSecurityHeaders({ isProduction: true });
    const byKey = Object.fromEntries(headers.map((header) => [header.key, header.value]));

    expect(byKey['Strict-Transport-Security']).toBe('max-age=63072000; includeSubDomains');
    expect(byKey['Content-Security-Policy-Report-Only']).not.toContain("'unsafe-eval'");
  });

  it('includes every required directive in Content-Security-Policy-Report-Only', () => {
    const csp = buildCspReportOnlyHeader({ isProduction: true });
    const directives = csp.split('; ');

    expect(directives).toEqual([
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "form-action 'self'",
      "img-src 'self' data: blob: https://res.cloudinary.com",
      "font-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline'",
      "connect-src 'self'",
    ]);
  });
});
