"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { isStaffRole } from "@/lib/auth/roles";
import { isInStaffScope } from "@/lib/auth/staff-scope";
import { NOTIFICATION_TYPES } from "@/lib/constants/notification-types";
import { insertNotification } from "@/lib/db/insert-notification";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

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
