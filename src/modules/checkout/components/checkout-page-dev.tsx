'use client';

import { useEffect } from 'react';
import messages from '@/i18n/messages/ar.json';
import type { components } from '@/shared/lib/api';
import { CheckoutProvider, useCheckout, type PreviewState } from '../provider/checkout-provider';
import { AddressStep, type AddressStepFixtures } from './address-step';
import { OrderSummary } from './order-summary';

const examplePreview: components['schemas']['CheckoutPreviewDto'] = {
  items: [
    {
      kind: 'Book',
      bookId: 1,
      bundleId: null,
      title: messages.site.brand,
      quantity: 1,
      unitPrice: 100,
      lineTotal: 100,
      warning: null,
      availableQuantity: null,
    },
  ],
  subtotal: 100,
  couponCode: null,
  couponDiscount: 0,
  shippingFee: 20,
  freeShippingApplied: false,
  total: 120,
  zone: {
    id: 1,
    governorate: messages.addresses.shippingZoneId,
    freeShippingThreshold: null,
    shippingFee: 20,
  },
};

function DevContent({ state }: { state: string }) {
  const { setPreview } = useCheckout();
  useEffect(() => {
    let preview: PreviewState = { status: 'ok', data: examplePreview };
    if (state === 'loading') preview = { status: 'loading' };
    if (state === 'error') preview = { status: 'error', message: messages.apiErrors.generic };
    if (state === 'empty') preview = { status: 'idle' };
    if (state === 'unavailable')
      preview = {
        status: 'ok',
        data: {
          ...examplePreview,
          items: examplePreview.items.map((item) => ({
            ...item,
            warning: 'out_of_stock',
            availableQuantity: 0,
          })),
        },
      };
    setPreview(preview);
  }, [setPreview, state]);
  const fixtures: AddressStepFixtures = {
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
        shippingPrice: 20,
        freeShippingThreshold: null,
        estimatedDays: null,
      },
    ],
    loading: state === 'loading',
  };
  return (
    <>
      <h1>{messages.checkout.title}</h1>
      <AddressStep fixtures={fixtures} />
      <OrderSummary />
    </>
  );
}

export function CheckoutPageDev({ state }: { state: string }) {
  return (
    <CheckoutProvider>
      <DevContent state={state} />
    </CheckoutProvider>
  );
}
