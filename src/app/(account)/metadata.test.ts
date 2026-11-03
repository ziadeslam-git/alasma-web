import { describe, expect, it } from 'vitest';

import { metadata as accountLayout } from './layout';
import { metadata as account } from './account/page';
import { metadata as addresses } from './account/addresses/page';
import { metadata as orders } from './account/orders/page';
import { metadata as orderDetails } from './account/orders/[id]/page';
import { metadata as cart } from '../(site)/cart/page';
import { metadata as checkout } from '../(site)/checkout/page';
import { metadata as checkoutSuccess } from '../(site)/checkout/success/[orderId]/page';

describe('private route metadata', () => {
  it.each([
    accountLayout,
    account,
    addresses,
    orders,
    orderDetails,
    cart,
    checkout,
    checkoutSuccess,
  ])('disables indexing and following', (metadata) => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
