import messages from '@/i18n/messages/ar.json';
import {
  ADMIN_FLAGS,
  ADMIN_PERMISSIONS,
  ROLES,
  type AdminFlag,
  type AdminPermission,
} from '@/shared/config/admin-permissions';
import { routes } from '@/shared/config/routes';
import type { IconName } from '@/shared/icons/icon-registry';

export type NavGroupId = keyof typeof messages.admin.nav.groups;
export type NavItemKey = keyof typeof messages.admin.nav.items;

export type NavItem = {
  href: string;
  labelKey: NavItemKey;
  group: NavGroupId;
  // Missing only for the developer item, which is decided by the role alone.
  permission?: AdminPermission;
  // The backend flag that switches the section on. A switched-off flag hides the item from an Admin and shows it
  // faded with the soon badge to the owner.
  flag?: AdminFlag;
  // Only this role sees the item (the owner role SuperAdmin does not).
  role?: string;
};

export type NavGroup = { id: NavGroupId; icon: IconName };

// The eight groups of the design (admin top pills and the phone sheet), in that order.
export const NAV_GROUPS: readonly NavGroup[] = [
  { id: 'overview', icon: 'dash' },
  { id: 'books', icon: 'book' },
  { id: 'orders', icon: 'list' },
  { id: 'offers', icon: 'tag' },
  { id: 'people', icon: 'users' },
  { id: 'content', icon: 'grid' },
  { id: 'packages', icon: 'package' },
  { id: 'settings', icon: 'settings' },
];

// The slim icon rail shows six of them, in this order (the design's rail).
export const RAIL_GROUP_IDS: readonly NavGroupId[] = [
  'overview',
  'orders',
  'books',
  'people',
  'content',
  'settings',
];

const adminRoute = (segment: string) => `${routes.admin}/${segment}`;
const p = ADMIN_PERMISSIONS;
const f = ADMIN_FLAGS;

// Not listed on purpose: "discounts" (no API: a discount lives on the book), customer carts, stores and the global
// admin search have no endpoint yet.
export const NAV_ITEMS: readonly NavItem[] = [
  {
    href: routes.admin,
    labelKey: 'dashboard',
    group: 'overview',
    permission: p.dashboardView,
    flag: f.reportsDashboard,
  },
  { href: adminRoute('orders'), labelKey: 'orders', group: 'orders', permission: p.ordersView },
  {
    href: adminRoute('payments'),
    labelKey: 'payments',
    group: 'orders',
    permission: p.ordersView,
  },
  {
    href: adminRoute('alerts'),
    labelKey: 'alerts',
    group: 'settings',
    permission: p.alertsView,
    flag: f.ordersAlerts,
  },

  { href: adminRoute('books'), labelKey: 'books', group: 'books', permission: p.booksEdit },
  {
    href: adminRoute('inventory'),
    labelKey: 'inventory',
    group: 'books',
    permission: p.booksManageStock,
  },
  {
    href: adminRoute('authors'),
    labelKey: 'authors',
    group: 'people',
    permission: p.authorsManage,
  },
  {
    href: adminRoute('categories'),
    labelKey: 'categories',
    group: 'books',
    permission: p.categoriesManage,
  },
  {
    href: adminRoute('publishers'),
    labelKey: 'publishers',
    group: 'books',
    permission: p.publishersManage,
  },
  {
    href: adminRoute('offers'),
    labelKey: 'offers',
    group: 'offers',
    permission: p.bundlesManage,
    flag: f.catalogBundles,
  },

  {
    href: adminRoute('coupons'),
    labelKey: 'coupons',
    group: 'offers',
    permission: p.couponsManage,
    flag: f.marketingCoupons,
  },
  {
    href: adminRoute('shipping'),
    labelKey: 'shipping',
    group: 'settings',
    permission: p.shippingManage,
  },

  {
    href: adminRoute('pages'),
    labelKey: 'pages',
    group: 'content',
    permission: p.pagesManage,
    flag: f.cmsStaticPages,
  },
  {
    href: adminRoute('banners'),
    labelKey: 'banners',
    group: 'content',
    permission: p.contentManage,
    flag: f.marketingBanners,
  },
  {
    href: adminRoute('quotes'),
    labelKey: 'quotes',
    group: 'books',
    permission: p.contentManage,
    flag: f.marketingQuotes,
  },
  {
    href: adminRoute('events'),
    labelKey: 'events',
    group: 'content',
    permission: p.contentManage,
    flag: f.marketingEvents,
  },
  {
    href: adminRoute('reviews'),
    labelKey: 'reviews',
    group: 'books',
    permission: p.reviewsModerate,
    flag: f.catalogReviews,
  },
  {
    href: adminRoute('reservations'),
    labelKey: 'reservations',
    group: 'orders',
    permission: p.reservationsManage,
    flag: f.catalogReservations,
  },
  {
    href: adminRoute('newsletter'),
    labelKey: 'newsletter',
    group: 'content',
    permission: p.subscribersView,
    flag: f.marketingNewsletter,
  },

  {
    href: adminRoute('packages'),
    labelKey: 'packages',
    group: 'packages',
    permission: p.packagesManage,
    flag: f.publishingPackages,
  },
  {
    href: adminRoute('publishing-requests'),
    labelKey: 'publishingRequests',
    group: 'packages',
    permission: p.packageRequestsManage,
    flag: f.publishingManuscriptRequests,
  },

  {
    href: adminRoute('users'),
    labelKey: 'users',
    group: 'people',
    permission: p.usersView,
  },
  {
    href: adminRoute('permissions'),
    labelKey: 'permissions',
    group: 'settings',
    permission: p.rolesManage,
  },
  {
    href: adminRoute('audit-log'),
    labelKey: 'auditLog',
    group: 'settings',
    permission: p.auditView,
  },
  {
    href: adminRoute('reports'),
    labelKey: 'reports',
    group: 'settings',
    permission: p.reportsView,
  },
  {
    href: adminRoute('settings'),
    labelKey: 'settings',
    group: 'settings',
    permission: p.settingsManage,
  },

  { href: adminRoute('dev'), labelKey: 'dev', group: 'settings', role: ROLES.developer },
];

export type SheetItemKey = keyof typeof messages.admin.nav.sheetItems;

// One line of the phone sheet, exactly as the design lists it. `page` is the real nav item that decides the
// permission, the flag and the target; `soon` marks a design page that has no screen of its own yet (it stays inert
// even when its parent page is built).
export type SheetItem = { key: SheetItemKey; page: NavItemKey; soon?: boolean };
export type SheetGroup = { id: NavGroupId; items: readonly SheetItem[] };

// The sheet lists of the design (.am__sheet), same groups, labels and order.
export const SHEET_GROUPS: readonly SheetGroup[] = [
  { id: 'overview', items: [{ key: 'overview', page: 'dashboard' }] },
  {
    id: 'books',
    items: [
      { key: 'allBooks', page: 'books' },
      { key: 'editBook', page: 'books', soon: true },
      { key: 'categories', page: 'categories' },
      { key: 'inventory', page: 'inventory' },
      { key: 'quotes', page: 'quotes' },
      { key: 'reviews', page: 'reviews' },
    ],
  },
  {
    id: 'orders',
    items: [
      { key: 'allOrders', page: 'orders' },
      { key: 'orderDetail', page: 'orders', soon: true },
      { key: 'adminView', page: 'orders', soon: true },
      { key: 'paymentReview', page: 'payments' },
      { key: 'shipping', page: 'shipping' },
      { key: 'abandonedCarts', page: 'orders', soon: true },
      { key: 'reservations', page: 'reservations' },
      { key: 'printedReports', page: 'reports' },
    ],
  },
  {
    id: 'offers',
    items: [
      { key: 'discounts', page: 'offers', soon: true },
      { key: 'coupons', page: 'coupons' },
      { key: 'bundles', page: 'offers' },
    ],
  },
  {
    id: 'people',
    items: [
      { key: 'customers', page: 'users' },
      { key: 'authors', page: 'authors' },
      { key: 'authorPage', page: 'authors', soon: true },
    ],
  },
  {
    id: 'content',
    items: [
      { key: 'homeSections', page: 'pages', soon: true },
      { key: 'banners', page: 'banners' },
      { key: 'events', page: 'events' },
      { key: 'whereToFind', page: 'pages', soon: true },
      { key: 'policies', page: 'pages', soon: true },
      { key: 'newsletter', page: 'newsletter' },
    ],
  },
  {
    id: 'packages',
    items: [
      { key: 'packages', page: 'packages' },
      { key: 'publishingRequests', page: 'publishingRequests' },
    ],
  },
  {
    id: 'settings',
    items: [
      { key: 'storeSettings', page: 'settings' },
      { key: 'shippingRates', page: 'shipping', soon: true },
      { key: 'paymentMethods', page: 'settings', soon: true },
      { key: 'adminPermissions', page: 'permissions' },
      { key: 'alerts', page: 'alerts' },
      { key: 'auditLog', page: 'auditLog' },
      { key: 'devPanel', page: 'dev' },
    ],
  },
];

// Pages that exist today. A menu entry whose page is not built yet is shown inert with the soon hint, never as a link
// to a page that does not exist. Add the route here in the task that builds the page.
export const BUILT_ADMIN_ROUTES: ReadonlySet<string> = new Set([
  routes.admin,
  adminRoute('orders'),
]);
