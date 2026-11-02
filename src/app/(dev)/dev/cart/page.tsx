import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import messages from '@/i18n/messages/ar.json';
import { CartView } from '@/modules/cart';
import type { components } from '@/shared/lib/api';

export const metadata: Metadata = { title: 'Cart (dev)', robots: { index: false, follow: false } };
export default async function DevCart({
  searchParams,
}: { searchParams?: Promise<Record<string, string | string[] | undefined>> } = {}) {
  if (process.env.NODE_ENV === 'production') notFound();
  const state = (await searchParams)?.state;
  const item: components['schemas']['CartLineDto'] = {
    itemId: 1,
    kind: state === 'bundle' ? 'Bundle' : 'Book',
    productId: 1,
    slug: 'sample',
    title:
      state === 'long'
        ? Array(8).fill(messages.devCatalog.fixtures.plainTitle).join(' ')
        : messages.devCatalog.fixtures.plainTitle,
    coverImageUrl: null,
    quantity: 1,
    listUnitPrice: 100,
    unitPrice: 100,
    lineTotal: 100,
    discountPercent: 0,
    warnings: state === 'warnings' ? [{ code: 'insufficient_stock', availableQuantity: 1 }] : [],
  };
  return (
    <main id="main-content">
      <CartView
        readOnly
        cart={{ items: state === 'empty' ? [] : [item], subtotal: state === 'empty' ? 0 : 100 }}
      />
    </main>
  );
}
