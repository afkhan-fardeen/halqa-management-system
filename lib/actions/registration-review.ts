"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { isStaffRole } from "@/lib/auth/roles";
import { isInStaffScope } from "@/lib/auth/staff-scope";
import {
  sendRegistrationApprovedEmail,
  sendRegistrationRejectedEmail,
} from "@/lib/email/registration-emails";
import { NOTIFICATION_TYPES } from "@/lib/constants/notification-types";
import { insertNotification } from "@/lib/db/insert-notification";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export type ReviewActionState = { error?: string; success?: boolean };

const userIdSchema = z.string().uuid();

async function assertCanReviewTarget(targetUserId: string) {
  const session = await auth();
  if (!session?.user) {
    return { ok: false as const, error: "Unauthorized" };
  }
  if (!isStaffRole(session.user.role)) {
    return { ok: false as const, error: "Forbidden" };
  }

  const [target] = await db
    .select()
    .from(users)
    .where(eq(users.id, targetUserId))
    .limit(1);

  if (!target) {
    return { ok: false as const, error: "User not found" };
  }
  if (target.status !== "PENDING" || target.role !== "MEMBER") {
    return { ok: false as const, error: "This registration is not pending" };
  }

  if (!isInStaffScope(session.user, target.halqa, target.genderUnit)) {
    return { ok: false as const, error: "Forbidden" };
  }

  return { ok: true as const, session, target };
}

export async function approveRegistration(
  _prev: ReviewActionState | null,
  formData: FormData,
): Promise<ReviewActionState> {
  const parsedId = userIdSchema.safeParse(formData.get("userId"));
  if (!parsedId.success) {
    return { error: "Invalid request" };
  }

  const gate = await assertCanReviewTarget(parsedId.data);
  if (!gate.ok) {
    return { error: gate.error };
  }

  const { session, target } = gate;

  await db
    .update(users)
    .set({
      status: "ACTIVE",
      approvedBy: session.user.id,
      approvedAt: new Date(),
      updatedAt: new Date(),
      rejectionReason: null,
    })
    .where(eq(users.id, target.id));

  await sendRegistrationApprovedEmail(target.email, target.name).catch(
    (err) => console.error("[email]", err),
  );

  await insertNotification({
    userId: target.id,
    type: NOTIFICATION_TYPES.REGISTRATION_APPROVED,
    message: "Your registration was approved. You can sign in now.",
  }).catch((err) => console.error("[notification]", err));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/registrations");
  return { success: true };
}

const rejectSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().trim().min(1, "Reason is required").max(2000),
});

export async function rejectRegistration(
  _prev: ReviewActionState | null,
  formData: FormData,
): Promise<ReviewActionState> {
  const parsed = rejectSchema.safeParse({
    userId: formData.get("userId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const gate = await assertCanReviewTarget(parsed.data.userId);
  if (!gate.ok) {
    return { error: gate.error };
  }

  const { target } = gate;

  await db
    .update(users)
    .set({
      status: "REJECTED",
      rejectionReason: parsed.data.reason,
      updatedAt: new Date(),
      approvedBy: null,
      approvedAt: null,
    })
    .where(eq(users.id, target.id));

  await sendRegistrationRejectedEmail(
    target.email,
    target.name,
    parsed.data.reason,
  ).catch((err) => console.error("[email]", err));

  await insertNotification({
    userId: target.id,
    type: NOTIFICATION_TYPES.REGISTRATION_REJECTED,
    message: `Your registration was not approved. Reason: ${parsed.data.reason.slice(0, 500)}`,
  }).catch((err) => console.error("[notification]", err));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/registrations");
  return { success: true };
}
