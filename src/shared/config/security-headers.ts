export type SecurityHeader = {
  key: string;
  value: string;
};

export type SecurityHeadersOptions = {
  isProduction?: boolean;
};

// Content-Security-Policy-Report-Only directives. Starting in Report-Only avoids breaking Next hydration while still
// reporting any violation in the browser console. Production never includes 'unsafe-eval'.
export function buildCspReportOnlyHeader(options: SecurityHeadersOptions = {}): string {
  const isProduction = options.isProduction ?? process.env.NODE_ENV === 'production';
  const scriptSrc = isProduction
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "form-action 'self'",
    "img-src 'self' data: blob: https://res.cloudinary.com",
    "font-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    scriptSrc,
    "connect-src 'self'",
  ].join('; ');
}

export function buildSecurityHeaders(options: SecurityHeadersOptions = {}): SecurityHeader[] {
  const isProduction = options.isProduction ?? process.env.NODE_ENV === 'production';
  const headers: SecurityHeader[] = [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-Frame-Options', value: 'DENY' },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=(), payment=()',
    },
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
    {
      key: 'Content-Security-Policy-Report-Only',
      value: buildCspReportOnlyHeader({ isProduction }),
    },
  ];

  if (isProduction) {
    headers.push({
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains',
    });
  }

  return headers;
}
