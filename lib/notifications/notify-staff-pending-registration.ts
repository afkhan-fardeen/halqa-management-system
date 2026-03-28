import { formatHalqaLabel } from "@/lib/constants/halqas";
import { NOTIFICATION_TYPES } from "@/lib/constants/notification-types";
import { insertNotification } from "@/lib/db/insert-notification";
import { sendStaffNewRegistrationEmail } from "@/lib/email/staff-registration-emails";
import { getStaffRecipientsForNewRegistration } from "@/lib/queries/staff-registration-recipients";

const ACTION_PATH = "/dashboard/registrations";

/**
 * In-app + web push for staff; transactional email per recipient (SMTP optional).
 */
export async function notifyStaffOfPendingRegistration(options: {
  applicantName: string;
  halqa: string;
  genderUnit: string;
}): Promise<void> {
  const recipients = await getStaffRecipientsForNewRegistration(
    options.halqa as Parameters<typeof getStaffRecipientsForNewRegistration>[0],
    options.genderUnit as Parameters<typeof getStaffRecipientsForNewRegistration>[1],
  );

  const halqaLine = formatHalqaLabel(options.halqa);
  const message = `${options.applicantName} requested to join ${halqaLine} (${options.genderUnit}). Review pending registrations.`;

  await Promise.all(
    recipients.map((r) =>
      insertNotification({
        userId: r.id,
        type: NOTIFICATION_TYPES.PENDING_REGISTRATION_STAFF,
        message,
        actionUrl: ACTION_PATH,
        pushTitle: "New registration pending",
      }).catch((err) => console.error("[notify-staff-registration]", err)),
    ),
  );

  await Promise.allSettled(
    recipients.map((r) => {
      const first = r.name.trim().split(/\s+/)[0] || "there";
      return sendStaffNewRegistrationEmail(
        r.email,
        first,
        options.applicantName,
        options.halqa,
        options.genderUnit,
      );
    }),
  );
}
