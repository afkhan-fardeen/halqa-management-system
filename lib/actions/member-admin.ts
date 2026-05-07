"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { isStaffRole } from "@/lib/auth/roles";
import { isInStaffScope } from "@/lib/auth/staff-scope";
import { NOTIFICATION_TYPES } from "@/lib/constants/notification-types";
import { insertNotification } from "@/lib/db/insert-notification";
import { refreshDailyUnitStats } from "@/lib/db/refresh-daily-unit-stats";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { parseYmdToUtcDate, todayYmdLocal } from "@/lib/utils/date";

async function assertStaffCanAccessMember(targetId: string) {
  const session = await auth();
  if (!session?.user || !isStaffRole(session.user.role)) {
    return { ok: false as const, error: "Unauthorized" };
  }

  const [target] = await db
    .select()
    .from(users)
    .where(eq(users.id, targetId))
    .limit(1);

  if (!target) {
    return { ok: false as const, error: "User not found" };
  }
  if (target.role !== "MEMBER") {
    return { ok: false as const, error: "Only members can be managed here" };
  }

  if (!isInStaffScope(session.user, target.halqa, target.genderUnit)) {
    return { ok: false as const, error: "Forbidden" };
  }

  return { ok: true as const, session, target };
}

export async function deactivateMember(formData: FormData): Promise<void> {
  const userId = String(formData.get("userId") ?? "");
  if (!userId) {
    return;
  }

  const gate = await assertStaffCanAccessMember(userId);
  if (!gate.ok) {
    return;
  }

  const { target } = gate;

  if (target.status === "DEACTIVATED") {
    return;
  }

  await db
    .update(users)
    .set({ status: "DEACTIVATED", updatedAt: new Date() })
    .where(eq(users.id, target.id));

  await insertNotification({
    userId: target.id,
    type: NOTIFICATION_TYPES.ACCOUNT_DEACTIVATED,
    message:
      "Your account was deactivated by halqa staff. Contact your incharge if you believe this is a mistake.",
  }).catch((err) => console.error("[notification]", err));

  revalidatePath("/dashboard/members");
}

export type DeleteMemberResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Permanently removes a member account and cascaded data (logs, contacts, etc.).
 * Clears `approved_by` references first so self-FK does not block deletion.
 * Scoped staff may only delete members in their visibility scope.
 */
export async function deleteMemberPermanently(
  formData: FormData,
): Promise<DeleteMemberResult> {
  const userId = String(formData.get("userId") ?? "").trim();
  if (!userId) {
    return { ok: false, error: "Missing user" };
  }

  const gate = await assertStaffCanAccessMember(userId);
  if (!gate.ok) {
    return { ok: false, error: gate.error };
  }

  const { target } = gate;
  const today = parseYmdToUtcDate(todayYmdLocal());

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ approvedBy: null, approvedAt: null })
        .where(eq(users.approvedBy, target.id));

      await tx.delete(users).where(eq(users.id, target.id));

      await refreshDailyUnitStats(tx, today, target.halqa, target.genderUnit);
    });
  } catch (e) {
    console.error("[deleteMemberPermanently]", e);
    return {
      ok: false,
      error: "Could not delete user. They may still be referenced somewhere.",
    };
  }

  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard/registrations");
  revalidatePath("/dashboard");
  return { ok: true };
}
