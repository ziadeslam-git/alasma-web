// The permission names the API puts in GET /me (permissions[]). One constant per name so a page never types the
// string itself. The list mirrors the backend's endpoint-permissions table; a page adds the names it needs.
export const ADMIN_PERMISSIONS = {
  alertsResolve: 'Alerts.Resolve',
  alertsView: 'Alerts.View',
  auditView: 'Audit.View',
  authorsManage: 'Authors.Manage',
  booksCreate: 'Books.Create',
  booksDelete: 'Books.Delete',
  booksEdit: 'Books.Edit',
  booksEditPrice: 'Books.EditPrice',
  booksManageStock: 'Books.ManageStock',
  bundlesManage: 'Bundles.Manage',
  categoriesManage: 'Categories.Manage',
  contentManage: 'Content.Manage',
  couponsManage: 'Coupons.Manage',
  dashboardView: 'Dashboard.View',
  ordersCancel: 'Orders.Cancel',
  ordersChangeStatus: 'Orders.ChangeStatus',
  ordersView: 'Orders.View',
  packageRequestsManage: 'PackageRequests.Manage',
  packagesManage: 'Packages.Manage',
  pagesManage: 'Pages.Manage',
  paymentsReview: 'Payments.Review',
  publishersManage: 'Publishers.Manage',
  reportsView: 'Reports.View',
  reservationsManage: 'Reservations.Manage',
  reviewsModerate: 'Reviews.Moderate',
  rolesManage: 'Roles.Manage',
  settingsManage: 'Settings.Manage',
  shippingManage: 'Shipping.Manage',
  subscribersView: 'Subscribers.View',
  usersManage: 'Users.Manage',
  usersView: 'Users.View',
} as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[keyof typeof ADMIN_PERMISSIONS];

// The backend feature flag keys (GET /me features[] and GET /feature-flags). The owner (SuperAdmin) also gets the
// switched-off ones, so the menu can show them faded; an Admin gets only the enabled ones.
export const ADMIN_FLAGS = {
  catalogBundles: 'Catalog.Bundles',
  catalogReservations: 'Catalog.Reservations',
  catalogReviews: 'Catalog.Reviews',
  cmsStaticPages: 'Cms.StaticPages',
  marketingBanners: 'Marketing.Banners',
  marketingCoupons: 'Marketing.Coupons',
  marketingEvents: 'Marketing.Events',
  marketingNewsletter: 'Marketing.Newsletter',
  marketingQuotes: 'Marketing.Quotes',
  ordersAlerts: 'Orders.Alerts',
  publishingManuscriptRequests: 'Publishing.ManuscriptRequests',
  publishingPackages: 'Publishing.Packages',
  reportsDashboard: 'Reports.Dashboard',
} as const;

export type AdminFlag = (typeof ADMIN_FLAGS)[keyof typeof ADMIN_FLAGS];

// Role names in GET /me (roles[]). A visitor whose only role is Customer never gets the admin frame.
export const ROLES = {
  admin: 'Admin',
  customer: 'Customer',
  developer: 'Developer',
  superAdmin: 'SuperAdmin',
} as const;
