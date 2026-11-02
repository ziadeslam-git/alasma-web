import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import messages from '@/i18n/messages/ar.json';
import { AddressesView, type AddressFixtures } from '@/modules/addresses';

export const metadata: Metadata = {
  title: 'Addresses (dev)',
  robots: { index: false, follow: false },
};
export default async function DevAddressesPage({
  searchParams,
}: { searchParams?: Promise<{ state?: string }> } = {}) {
  if (process.env.NODE_ENV === 'production') notFound();
  const state = (await searchParams)?.state;
  const fixtures: AddressFixtures = {
    addresses:
      state === 'empty'
        ? []
        : [
            {
              id: 1,
              recipientName: messages.site.brand,
              phone: '01012345678',
              shippingZoneId: 1,
              governorateName: messages.addresses.shippingZoneId,
              city: messages.addresses.city,
              addressLine: messages.addresses.addressLine,
              landmark: null,
              isDefault: true,
            },
          ],
    zones: [
      {
        id: 1,
        nameAr: messages.addresses.shippingZoneId,
        nameEn: '',
        shippingPrice: 25,
        freeShippingThreshold: null,
        estimatedDays: 3,
      },
    ],
  };
  return (
    <main id="main-content">
      <AddressesView fixtures={fixtures} />
    </main>
  );
}
