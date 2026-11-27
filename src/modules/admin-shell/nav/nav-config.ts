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

// Order of the groups in the menu.
export const NAV_GROUPS: readonly NavGroup[] = [
  { id: 'operations', icon: 'chart' },
  { id: 'catalog', icon: 'book' },
  { id: 'pricing', icon: 'tag' },
  { id: 'content', icon: 'grid' },
  { id: 'publishing', icon: 'package' },
  { id: 'administration', icon: 'settings' },
  { id: 'developer', icon: 'shield' },
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
    group: 'operations',
    permission: p.dashboardView,
    flag: f.reportsDashboard,
  },
  { href: adminRoute('orders'), labelKey: 'orders', group: 'operations', permission: p.ordersView },
  {
    href: adminRoute('payments'),
    labelKey: 'payments',
    group: 'operations',
    permission: p.ordersView,
  },
  {
    href: adminRoute('alerts'),
    labelKey: 'alerts',
    group: 'operations',
    permission: p.alertsView,
    flag: f.ordersAlerts,
  },

  { href: adminRoute('books'), labelKey: 'books', group: 'catalog', permission: p.booksEdit },
  {
    href: adminRoute('inventory'),
    labelKey: 'inventory',
    group: 'catalog',
    permission: p.booksManageStock,
  },
  {
    href: adminRoute('authors'),
    labelKey: 'authors',
    group: 'catalog',
    permission: p.authorsManage,
  },
  {
    href: adminRoute('categories'),
    labelKey: 'categories',
    group: 'catalog',
    permission: p.categoriesManage,
  },
  {
    href: adminRoute('publishers'),
    labelKey: 'publishers',
    group: 'catalog',
    permission: p.publishersManage,
  },
  {
    href: adminRoute('offers'),
    labelKey: 'offers',
    group: 'catalog',
    permission: p.bundlesManage,
    flag: f.catalogBundles,
  },

  {
    href: adminRoute('coupons'),
    labelKey: 'coupons',
    group: 'pricing',
    permission: p.couponsManage,
    flag: f.marketingCoupons,
  },
  {
    href: adminRoute('shipping'),
    labelKey: 'shipping',
    group: 'pricing',
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
    group: 'content',
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
    group: 'content',
    permission: p.reviewsModerate,
    flag: f.catalogReviews,
  },
  {
    href: adminRoute('reservations'),
    labelKey: 'reservations',
    group: 'content',
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
    group: 'publishing',
    permission: p.packagesManage,
    flag: f.publishingPackages,
  },
  {
    href: adminRoute('publishing-requests'),
    labelKey: 'publishingRequests',
    group: 'publishing',
    permission: p.packageRequestsManage,
    flag: f.publishingManuscriptRequests,
  },

  {
    href: adminRoute('users'),
    labelKey: 'users',
    group: 'administration',
    permission: p.usersView,
  },
  {
    href: adminRoute('permissions'),
    labelKey: 'permissions',
    group: 'administration',
    permission: p.rolesManage,
  },
  {
    href: adminRoute('audit-log'),
    labelKey: 'auditLog',
    group: 'administration',
    permission: p.auditView,
  },
  {
    href: adminRoute('reports'),
    labelKey: 'reports',
    group: 'administration',
    permission: p.reportsView,
  },
  {
    href: adminRoute('settings'),
    labelKey: 'settings',
    group: 'administration',
    permission: p.settingsManage,
  },

  { href: adminRoute('dev'), labelKey: 'dev', group: 'developer', role: ROLES.developer },
];
