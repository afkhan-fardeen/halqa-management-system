/**
 * In-app notification `type` values stored in `notifications.type`.
 * Keep in sync with icons in `components/notifications/notification-type-icon.tsx`.
 */
export const NOTIFICATION_TYPES = {
  /** Staff: new member self-registration awaiting review (incharge/secretary/admin scope) */
  PENDING_REGISTRATION_STAFF: "pending_registration_staff",
  /** Cron: member missing full daily log (salat + quran + hadith saved) today */
  DAILY_REMINDER: "daily_reminder",
  /** Staff approved self-registration */
  REGISTRATION_APPROVED: "registration_approved",
  /** Staff rejected self-registration */
  REGISTRATION_REJECTED: "registration_rejected",
  /** Seed / demo only */
  DEMO_WELCOME: "demo_welcome",
  /** User completed password reset via email link */
  PASSWORD_CHANGED: "password_changed",
  /** Staff deactivated member account */
  ACCOUNT_DEACTIVATED: "account_deactivated",
  /** Staff broadcast to members (admin or halqa/gender-scoped incharge/secretary) */
  STAFF_ANNOUNCEMENT: "staff_announcement",
  /** After session end (cron) or manual staff nudge — mark Dawati / Tarbiyati attendance */
  ATTENDANCE_REMINDER: "attendance_reminder",
  /** Cron: nudge after Bahrain adhan + offset to fill ehtisaab for that salah */
  EHTISAAB_PRAYER_NUDGE: "ehtisaab_prayer_nudge",
  /** Cron: fixed ~09:30 Bahrain — fill today’s ehtisaab form */
  EHTISAAB_MORNING_NUDGE: "ehtisaab_morning_nudge",
} as const;

export type NotificationTypeKey = keyof typeof NOTIFICATION_TYPES;
export type NotificationTypeValue =
  (typeof NOTIFICATION_TYPES)[NotificationTypeKey];
