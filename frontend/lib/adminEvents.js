export const ADMIN_REQUEST_UPDATED_EVENT = 'admin:request-updated';
export const ADMIN_MEETING_UPDATED_EVENT = 'admin:meeting-updated';
export const ADMIN_BADGE_REFRESH_EVENT = 'admin:badge-refresh';
export const ADMIN_ANALYTICS_REFRESH_EVENT = 'admin:analytics-refresh';

export function notifyAdminRequestUpdated(request) {
  if (typeof window === 'undefined' || !request) return;
  window.dispatchEvent(new CustomEvent(ADMIN_REQUEST_UPDATED_EVENT, { detail: { request } }));
  notifyAdminBadgeRefresh();
  notifyAdminAnalyticsRefresh();
}

export function notifyAdminMeetingUpdated(detail) {
  if (typeof window === 'undefined' || !detail) return;
  window.dispatchEvent(new CustomEvent(ADMIN_MEETING_UPDATED_EVENT, { detail }));
  notifyAdminAnalyticsRefresh();
}

export function notifyAdminBadgeRefresh() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(ADMIN_BADGE_REFRESH_EVENT));
}

export function notifyAdminAnalyticsRefresh() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(ADMIN_ANALYTICS_REFRESH_EVENT));
}
