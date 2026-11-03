import type { MetadataRoute } from 'next';

import { absoluteUrl } from '@/shared/config/site';

export const ROBOTS_DISALLOW_PATHS = [
  '/account',
  '/admin',
  '/cart',
  '/checkout',
  '/dev',
  '/api',
] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [...ROBOTS_DISALLOW_PATHS],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
