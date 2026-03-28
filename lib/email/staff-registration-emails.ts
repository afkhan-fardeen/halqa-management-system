import { resetLinkBaseUrl } from "@/lib/auth/reset-token";
import {
  EMAIL_BRAND_NAME,
  emailDocumentHtml,
  emailParagraphHtml,
  emailPrimaryButtonHtml,
} from "@/lib/email/html-layout";
import { sendTransactionalEmail } from "@/lib/email/mailer";

function formatHalqaLabel(halqa: string) {
  return halqa.replaceAll("_", " ");
}

/**
 * Email staff when a new member registers (pending approval). Uses same base URL as password reset.
 */
export async function sendStaffNewRegistrationEmail(
  to: string,
  staffFirstName: string,
  applicantName: string,
  halqa: string,
  genderUnit: string,
): Promise<boolean> {
  const base = resetLinkBaseUrl().replace(/\/$/, "");
  const reviewUrl = `${base}/dashboard/registrations`;

  const subject = `New registration pending review — ${EMAIL_BRAND_NAME}`;
  const halqaLine = formatHalqaLabel(halqa);

  const text = `Assalamu alaikum ${staffFirstName},\n\n${applicantName} has requested to join ${halqaLine} (${genderUnit}). Review and approve or reject from the dashboard.\n\nOpen pending registrations: ${reviewUrl}\n\nSign in if prompted. If you did not expect this message, you can ignore it.\n`;

  const inner = [
    emailParagraphHtml(`Assalamu alaikum ${staffFirstName},`),
    emailParagraphHtml(
      `${applicantName} has requested to join ${halqaLine} (${genderUnit}). Review and approve or reject when you are ready.`,
    ),
    emailPrimaryButtonHtml(reviewUrl, "Review pending registrations"),
    emailParagraphHtml(
      "If you are not already signed in, you will be asked to log in first.",
    ),
  ].join("");

  const html = emailDocumentHtml({
    title: "New registration pending",
    preheader: `${applicantName} — ${halqaLine} · ${genderUnit}`,
    innerHtml: inner,
  });

  return sendTransactionalEmail({ to, subject, text, html });
}
