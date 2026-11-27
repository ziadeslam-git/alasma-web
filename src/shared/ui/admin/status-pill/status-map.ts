// One map for every status the admin shows. Values are the API's string enum names (openapi: OrderStatus,
// PaymentStatus, BookStatus, ReviewStatus, OrderAlertStatus, PackageRequestStatus, BannerState; coupon uses the
// non-"All" values of CouponStatusFilter). The Arabic label of each value lives in ar.json: admin.status.<type>.<value>.
export type StatusType =
  'alert' | 'banner' | 'book' | 'coupon' | 'order' | 'payment' | 'request' | 'review';

export type StatusTone = 'danger' | 'info' | 'neutral' | 'success' | 'warning';

export const STATUS_TONES: Record<StatusType, Record<string, StatusTone>> = {
  alert: { Open: 'danger', Resolved: 'success' },
  banner: { Active: 'success', Expired: 'neutral', Hidden: 'warning', Scheduled: 'info' },
  book: { Draft: 'neutral', Hidden: 'warning', OutOfPrint: 'danger', Published: 'success' },
  coupon: { Active: 'success', Expired: 'danger', Inactive: 'neutral' },
  order: {
    Cancelled: 'danger',
    Confirmed: 'info',
    Delivered: 'success',
    PaymentReview: 'warning',
    PendingPayment: 'warning',
    Preparing: 'info',
    Shipped: 'info',
  },
  payment: {
    Approved: 'success',
    Pending: 'warning',
    Refunded: 'neutral',
    Rejected: 'danger',
    Submitted: 'info',
  },
  request: {
    Accepted: 'success',
    Completed: 'neutral',
    Contacted: 'warning',
    New: 'info',
    Rejected: 'danger',
  },
  review: { Approved: 'success', Pending: 'warning', Rejected: 'danger' },
};
