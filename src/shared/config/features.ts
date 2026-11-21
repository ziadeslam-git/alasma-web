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
  'reviews-section': 'live', // Reviews on the book page: GET /books/{slug}/reviews and POST /books/{id}/reviews (Task 92).
  'review-sort': 'soon', // Sort control above the reviews: the API only returns the newest first.
  'review-title': 'soon', // Title field of the review form: the API has no title.
  'wishlist-heart': 'live', // Wishlist heart on cards and the book page, the header/app-bar link and /account/wishlist: GET/PUT/DELETE /wishlist (Task 91).
  'reservations-notify-me': 'soon', // Notify-me action for unavailable books.
  'compare-books': 'soon', // Compare action in catalog and product designs.
  'wishlist-clear': 'soon', // Clear-all action on the wishlist page: the API has no bulk delete.
  'wishlist-add-available': 'soon', // Add-available-to-cart action on the wishlist page: no bulk endpoint.
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

  // Home page sections (home-banners and home-quotes are not rendered by the home page any more: not in the design)
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
  'cart-page': 'live', // Cart entry points in the header and mobile app bar.
  'email-change': 'soon', // Change email: the confirmation link has no page yet (POST /auth/confirm-email-change), so it stays soon.
  'profile-edit': 'live', // Profile page: PUT /me, change email, change password, sign out everywhere (Task 88).
  'order-invoice': 'live', // Printable invoice of a confirmed order: GET /orders/{id}/invoice (Task 90).
  'payment-proof': 'live', // Transfer receipt upload: POST /orders/{id}/payment-proof (Task 89).
  'payment-receipt': 'live', // Printable receipt of an approved payment: GET /orders/{id}/payments/{paymentId}/receipt (Task 89).
  'checkout-flow': 'live', // Checkout flow after the cart.
  'buy-now': 'soon', // Buy-now shortcut on the product page: checkout is Week 2, so it stays hidden until it works.
  'account-area': 'live', // Customer account entry points.
  'publish-packages': 'soon', // Publishing packages navigation entry.
  'resend-confirmation': 'live', // Resend confirmation email: POST /auth/resend-confirmation (Task 88).

  // Delivered catalog and authentication
  'catalog-search': 'live', // Catalog search field and results.
  'catalog-filters-basic': 'live', // Basic catalog filters.
  'catalog-sort-basic': 'live', // Basic catalog sorting.
  'catalog-authors': 'live', // Author pages.
  'catalog-categories': 'live', // Category detail pages.
  'catalog-categories-index': 'live', // Category index.
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
