import type { Metadata } from 'next';

import messages from '@/i18n/messages/ar.json';
import { getBundles, getDiscountedBooks, OffersView } from '@/modules/offers';
import { routes } from '@/shared/config/routes';
import { buildPageMetadata } from '@/shared/seo';

// Public and ISR (5 minutes): bundles and discounted books come from the API with their own prices.
// Next reads this value at build time, so it must be a literal (it equals OFFERS_REVALIDATE_SECONDS).
export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({
  title: messages.offers.meta.title,
  description: messages.offers.meta.description,
  path: routes.offers,
});

export default async function OffersPage() {
  const [bundles, discounted] = await Promise.all([getBundles(), getDiscountedBooks()]);
  return <OffersView bundles={bundles} discounted={discounted} />;
}
