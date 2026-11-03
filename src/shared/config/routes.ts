const encodeSegment = (segment: string) => encodeURIComponent(segment);

export const routes = {
  home: '/',
  books: '/books',
  authors: '/authors',
  categories: '/categories',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  confirmEmail: '/confirm-email',
  cart: '/cart',
  account: '/account',
  accountAddresses: '/account/addresses',
  accountOrders: '/account/orders',
  checkout: '/checkout',
  publish: '/publish',
} as const;

export const bookRoute = (slug: string) => `${routes.books}/${encodeSegment(slug)}`;
export const authorRoute = (slug: string) => `${routes.authors}/${encodeSegment(slug)}`;
export const categoryRoute = (slug: string) => `${routes.categories}/${encodeSegment(slug)}`;
export const staticPageRoute = (key: string) => `/pages/${encodeSegment(key)}`;
export const orderRoute = (id: string) => `${routes.accountOrders}/${encodeSegment(id)}`;
export const checkoutSuccessRoute = (id: string) =>
  `${routes.checkout}/success/${encodeSegment(id)}`;
