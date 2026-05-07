"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq, gt } from "drizzle-orm";
import { auth } from "@/auth";
import { hashPassword } from "@/lib/auth/credentials";
import { isStaffRole } from "@/lib/auth/roles";
import { isInStaffScope } from "@/lib/auth/staff-scope";
import {
  generateResetToken,
  hashResetToken,
} from "@/lib/auth/reset-token";
import {
  sendPasswordChangedConfirmationEmail,
  sendPasswordResetEmail,
} from "@/lib/email/password-reset-emails";
import { NOTIFICATION_TYPES } from "@/lib/constants/notification-types";
import { insertNotification } from "@/lib/db/insert-notification";
import { db } from "@/lib/db";
import { passwordResetTokens, users } from "@/lib/db/schema";
import { PASSWORD_RESET_EXPIRY_MS } from "@/lib/constants/password-reset";
import {
  newPasswordSchema,
  requestResetSchema,
} from "@/lib/validations/password-reset";

export type PasswordResetState = { error?: string; success?: boolean };

const TTL_MS = PASSWORD_RESET_EXPIRY_MS;
/** Minimum time between reset emails for the same user (abuse throttle). */
const RESET_EMAIL_COOLDOWN_MS = 90_000;

export async function requestPasswordReset(
  formData: FormData,
): Promise<PasswordResetState> {
  const parsed = requestResetSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid email" };
  }

  const email = parsed.data.email.toLowerCase();

  const [user] = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    return { success: true };
  }

  const [recentToken] = await db
    .select({ createdAt: passwordResetTokens.createdAt })
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.userId, user.id))
    .orderBy(desc(passwordResetTokens.createdAt))
    .limit(1);

  if (
    recentToken?.createdAt &&
    Date.now() - new Date(recentToken.createdAt).getTime() < RESET_EMAIL_COOLDOWN_MS
  ) {
    return { success: true };
  }

  const token = generateResetToken();
  const tokenHash = hashResetToken(token);
  const expiresAt = new Date(Date.now() + TTL_MS);

  await db
    .delete(passwordResetTokens)
    .where(eq(passwordResetTokens.userId, user.id));

  await db.insert(passwordResetTokens).values({
    id: crypto.randomUUID(),
    userId: user.id,
    tokenHash,
    expiresAt,
    createdAt: new Date(),
  });

  try {
    const sent = await sendPasswordResetEmail(user.email, user.name, token);
    if (!sent) {
      console.warn(
        "[password-reset] SMTP not configured — no email was sent. Set SMTP_USER and SMTP_PASS in .env.local and restart the dev server.",
      );
    }
  } catch (err) {
    console.error("[password-reset] send failed:", err);
  }

  return { success: true };
}

export async function resetPasswordWithToken(
  formData: FormData,
): Promise<PasswordResetState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!token || token.length < 10) {
    return { error: "Invalid or missing reset link." };
  }
  if (password !== confirm) {
    return { error: "Passwords do not match." };
  }

  const pwParsed = newPasswordSchema.safeParse(password);
  if (!pwParsed.success) {
    return { error: pwParsed.error.issues[0]?.message ?? "Invalid password" };
  }

  const tokenHash = hashResetToken(token);
  const now = new Date();

  const [row] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        gt(passwordResetTokens.expiresAt, now),
      ),
    )
    .limit(1);

  if (!row) {
    return { error: "This reset link is invalid or has expired." };
  }

  const passwordHash = await hashPassword(pwParsed.data);

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, row.userId));
    await tx
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, row.userId));
  });

  const [member] = await db
    .select({ email: users.email, name: users.name })
    .from(users)
    .where(eq(users.id, row.userId))
    .limit(1);

  if (member) {
    await Promise.all([
      insertNotification({
        userId: row.userId,
        type: NOTIFICATION_TYPES.PASSWORD_CHANGED,
        message:
          "Your password was changed. If this wasn’t you, contact your halqa team immediately.",
      }).catch((err) => console.error("[notification]", err)),
      sendPasswordChangedConfirmationEmail(member.email, member.name)
        .then((sent) => {
          if (!sent) {
            console.warn(
              "[password-reset] Confirmation email skipped — SMTP not configured.",
            );
          }
        })
        .catch((err) =>
          console.error("[password-reset] confirmation email failed:", err),
        ),
    ]);
  }

  return { success: true };
}

export async function adminSendPasswordResetEmail(
  formData: FormData,
): Promise<void> {
  const session = await auth();
  if (!session?.user || !isStaffRole(session.user.role)) {
    return;
  }

  const userId = String(formData.get("userId") ?? "");
  if (!userId) {
    return;
  }

  const [target] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!target) {
    return;
  }

  if (!isInStaffScope(session.user, target.halqa, target.genderUnit)) {
    return;
  }

  const token = generateResetToken();
  const tokenHash = hashResetToken(token);
  const expiresAt = new Date(Date.now() + TTL_MS);

  await db
    .delete(passwordResetTokens)
    .where(eq(passwordResetTokens.userId, target.id));

  await db.insert(passwordResetTokens).values({
    id: crypto.randomUUID(),
    userId: target.id,
    tokenHash,
    expiresAt,
    createdAt: new Date(),
  });

  try {
    const sent = await sendPasswordResetEmail(target.email, target.name, token);
    if (!sent) {
      console.warn(
        "[admin password-reset] SMTP not configured — no email was sent.",
      );
    }
  } catch (err) {
    console.error("[admin password-reset] send failed:", err);
  }

  revalidatePath("/dashboard/members");
}
