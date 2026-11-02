import { NextResponse, type NextRequest } from 'next/server';

import { isValidSegment, segmentRules } from '@/shared/lib/routing/segment-guard';

export function proxy(request: NextRequest) {
  const parts = request.nextUrl.pathname.split('/');
  const rule = parts.length === 3 && parts[1] ? segmentRules[parts[1]] : undefined;
  if (rule && parts[2] !== undefined && !isValidSegment(parts[2], rule)) {
    const destination = request.nextUrl.clone();
    destination.pathname = '/invalid-segment';
    destination.search = '';
    return NextResponse.rewrite(destination, {
      headers: {
        'cache-control': 'no-store',
        'x-robots-tag': 'noindex',
      },
    });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/books/:slug', '/authors/:slug', '/categories/:slug', '/pages/:key'],
};
