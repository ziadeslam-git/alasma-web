export { AddressCard } from './components/address-card';
export { AddressForm } from './components/address-form';
export { AddressesView } from './components/addresses-view';
export type { AddressFixtures } from './components/addresses-view';
export type { Address, AddressInput, ShippingZone } from './api/addresses';
export {
  listAddresses,
  listShippingZones,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from './api/addresses';
