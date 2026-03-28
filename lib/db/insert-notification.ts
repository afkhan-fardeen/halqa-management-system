import { NOTIFICATION_TYPES } from "@/lib/constants/notification-types";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { sendWebPushToUser } from "@/lib/push/send-web-push";
import { resolveNotificationPath } from "@/lib/utils/notification-default-url";

export async function insertNotification(options: {
  userId: string;
  type: string;
  message: string;
  /** Stored on the row; falls back to type-based default when omitted. */
  actionUrl?: string | null;
  /** Overrides push open URL (defaults to resolved action path). */
  pushUrl?: string | null;
  /** Overrides default title on the device notification (e.g. announcements). */
  pushTitle?: string;
}) {
  const resolvedPath = resolveNotificationPath(
    options.type,
    options.actionUrl ?? null,
  );

  await db.insert(notifications).values({
    id: crypto.randomUUID(),
    userId: options.userId,
    type: options.type,
    message: options.message,
    actionUrl: options.actionUrl?.trim() || resolvedPath,
    read: false,
    createdAt: new Date(),
  });

  const pushTitle =
    options.pushTitle ??
    (options.type === NOTIFICATION_TYPES.STAFF_ANNOUNCEMENT
      ? "New announcement"
      : options.type === NOTIFICATION_TYPES.PENDING_REGISTRATION_STAFF
        ? "New registration pending"
        : "Qalbee");

  const pushOpen =
    options.pushUrl?.trim() ||
    options.actionUrl?.trim() ||
    resolvedPath;

  await sendWebPushToUser({
    userId: options.userId,
    title: pushTitle,
    body: options.message,
    url: pushOpen.startsWith("/") ? pushOpen : `/${pushOpen}`,
  }).catch(() => {
    /* push optional */
  });
}
