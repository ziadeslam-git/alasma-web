import type { Metadata } from 'next';

import messages from '@/i18n/messages/ar.json';
import {
  BEST_SELLERS_REVALIDATE_SECONDS,
  BestsellersView,
  getBestSellers,
} from '@/modules/catalog';
import { routes } from '@/shared/config/routes';
import { buildPageMetadata } from '@/shared/seo';

// The ranking is public and ISR (one hour, like the "updated hourly" line of the design).
export const revalidate = BEST_SELLERS_REVALIDATE_SECONDS;

export const metadata: Metadata = buildPageMetadata({
  title: messages.bestsellers.meta.title,
  description: messages.bestsellers.meta.description,
  path: routes.bestsellers,
});

export default async function BestsellersPage() {
  const result = await getBestSellers();
  return <BestsellersView result={result} />;
}
