import type { Metadata } from 'next';

import messages from '@/i18n/messages/ar.json';
import {
  getBundles,
  getDiscountedBooks,
  OFFERS_REVALIDATE_SECONDS,
  OffersView,
} from '@/modules/offers';
import { routes } from '@/shared/config/routes';
import { buildPageMetadata } from '@/shared/seo';

// Public and ISR (5 minutes): bundles and discounted books come from the API with their own prices.
export const revalidate = OFFERS_REVALIDATE_SECONDS;

export const metadata: Metadata = buildPageMetadata({
  title: messages.offers.meta.title,
  description: messages.offers.meta.description,
  path: routes.offers,
});

export default async function OffersPage() {
  const [bundles, discounted] = await Promise.all([getBundles(), getDiscountedBooks()]);
  return <OffersView bundles={bundles} discounted={discounted} />;
}
