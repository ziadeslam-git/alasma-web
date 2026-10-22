export type FeatureState = 'live' | 'soon' | 'hidden';

// Backend flags will later combine with this local registry: a feature is usable only when it is locally live and any
// matching backend /feature-flags entry is enabled. This file deliberately performs no fetching.
export const features = {
  // Product details
  'ebook-format': 'soon', // Format selector on the product detail design.
  'book-format-prices': 'soon', // Format-specific prices on the product detail design.
  'book-sample-pdf': 'soon', // Sample PDF action on the product detail design.
  'book-report-error': 'soon', // Report-error action on the product detail design.
  'book-short-link': 'soon', // Short-link action on the product detail design.
  'review-helpful': 'soon', // Helpful vote beneath a review.
  'reviews-section': 'soon', // Reviews panel on the product detail design.
  'wishlist-heart': 'soon', // Wishlist heart on book cards and details.
  'reservations-notify-me': 'soon', // Notify-me action for unavailable books.
  'compare-books': 'soon', // Compare action in catalog and product designs.
  'quick-view': 'hidden', // Quick-view modal action on book cards (not planned).

  // Account and discovery
  'notifications-center': 'soon', // Notifications icon in the header design.
  'language-switch-en': 'soon', // English language switch in the header design.
  'sort-popular': 'soon', // Popular sort option in the catalog design.
  'sort-best-selling': 'soon', // Best-selling sort option in the catalog design.
  'sort-top-rated': 'soon', // Top-rated sort option in the catalog design.
  'filter-language': 'soon', // Language filter in the catalog design.
  'filter-cover-type': 'soon', // Cover-type filter in the catalog design.
  'filter-rating': 'soon', // Rating filter in the catalog design.
  'filter-facet-counts': 'soon', // Facet counts beside catalog filters.
  'search-tab-authors': 'soon', // Authors tab in search results.
  'search-tab-events': 'soon', // Events tab in search results.

  // Home and campaigns
  'home-banners': 'soon', // Promotional banner area on the home design.
  'home-quotes': 'soon', // Quote section on the home design.
  'home-events': 'soon', // Events section on the home design.
  'home-newsletter': 'soon', // Newsletter callout on the home design.
  'home-editor-pick': 'soon', // Editor pick on the home design.
  'home-team-picks': 'soon', // Team picks on the home design.
  'home-book-of-month': 'soon', // Book of the month on the home design.
  'home-most-popular': 'soon', // Most popular shelf on the home design.
  'pay-online-gateway': 'soon', // Online payment option in checkout.
  'public-coupons-list': 'soon', // Public coupons listing in offers.
  'save-for-later': 'soon', // Save-for-later action in the cart design.
  'offers-countdown': 'soon', // Offers countdown design element.
  'offers-bundles': 'soon', // Offers bundles design section.
  'cart-page': 'soon', // Cart entry points in the header and mobile app bar.
  'checkout-flow': 'soon', // Checkout flow after the cart.
  'account-area': 'soon', // Customer account entry points.
  'publish-packages': 'soon', // Publishing packages navigation entry.
  'resend-confirmation': 'soon', // Resend confirmation email: backend endpoint (S4) not delivered yet.

  // Delivered catalog and authentication
  'catalog-search': 'live', // Catalog search field and results.
  'catalog-filters-basic': 'live', // Basic catalog filters.
  'catalog-sort-basic': 'live', // Basic catalog sorting.
  'catalog-authors': 'live', // Catalog authors navigation.
  'catalog-categories': 'live', // Catalog categories navigation.
  'static-pages': 'live', // Static information pages.
  'auth-login': 'live', // Login page.
  'auth-register': 'live', // Registration page.
  'auth-password-reset': 'live', // Password reset flow.
  'auth-email-confirm': 'live', // Email confirmation flow.
} as const satisfies Record<string, FeatureState>;

export type FeatureKey = keyof typeof features;

export function getFeatureState(key: FeatureKey): FeatureState {
  return features[key];
}

export function isLive(key: FeatureKey) {
  return getFeatureState(key) === 'live';
}
