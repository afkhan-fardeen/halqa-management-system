import { NOTIFICATION_TYPES } from "@/lib/constants/notification-types";

/**
 * Default in-app / push path when `action_url` is not stored (legacy rows).
 */
export function defaultNotificationPathForType(type: string): string {
  switch (type) {
    case NOTIFICATION_TYPES.PENDING_REGISTRATION_STAFF:
      return "/dashboard/registrations";
    case NOTIFICATION_TYPES.DAILY_REMINDER:
      return "/submit";
    case NOTIFICATION_TYPES.REGISTRATION_APPROVED:
      return "/home";
    case NOTIFICATION_TYPES.REGISTRATION_REJECTED:
      return "/login";
    case NOTIFICATION_TYPES.PASSWORD_CHANGED:
      return "/login";
    case NOTIFICATION_TYPES.ACCOUNT_DEACTIVATED:
      return "/login";
    case NOTIFICATION_TYPES.STAFF_ANNOUNCEMENT:
      return "/notifications";
    case NOTIFICATION_TYPES.ATTENDANCE_REMINDER:
      return "/attendance";
    case NOTIFICATION_TYPES.EHTISAAB_PRAYER_NUDGE:
    case NOTIFICATION_TYPES.EHTISAAB_MORNING_NUDGE:
      return "/submit";
    case NOTIFICATION_TYPES.DEMO_WELCOME:
      return "/home";
    default:
      return "/notifications";
  }
}

export function resolveNotificationPath(
  type: string,
  storedUrl: string | null | undefined,
): string {
  if (storedUrl && storedUrl.trim().length > 0) {
    return storedUrl.startsWith("/") ? storedUrl : `/${storedUrl}`;
  }
  return defaultNotificationPathForType(type);
}
