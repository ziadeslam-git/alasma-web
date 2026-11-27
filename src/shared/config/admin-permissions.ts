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
  couponsManage: 'Coupons.Manage',
  dashboardView: 'Dashboard.View',
  ordersCancel: 'Orders.Cancel',
  ordersChangeStatus: 'Orders.ChangeStatus',
  ordersView: 'Orders.View',
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

// Role names in GET /me (roles[]). A visitor whose only role is Customer never gets the admin frame.
export const ROLES = {
  admin: 'Admin',
  customer: 'Customer',
  developer: 'Developer',
  superAdmin: 'SuperAdmin',
} as const;
