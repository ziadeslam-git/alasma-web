import { NextResponse, type NextRequest } from 'next/server';

import { isValidSegment, segmentRules } from '@/shared/lib/routing/segment-guard';

const INVALID_SEGMENT_PATH = '/invalid-segment';

export function proxy(request: NextRequest) {
  const parts = request.nextUrl.pathname.split('/');
  const rule = parts.length === 3 && parts[1] ? segmentRules[parts[1]] : undefined;
  if (rule && parts[2] !== undefined && !isValidSegment(parts[2], rule)) {
    const destination = request.nextUrl.clone();
    destination.pathname = INVALID_SEGMENT_PATH;
    destination.search = '';
    // The target page renders the Arabic not-found UI as plain content, so the 404 status comes from here.
    return NextResponse.rewrite(destination, {
      status: 404,
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
