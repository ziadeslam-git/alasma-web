export const CART_CHANGED_EVENT = 'alasma-cart-changed';
export function notifyCartChanged() {
  window.dispatchEvent(new Event(CART_CHANGED_EVENT));
}
