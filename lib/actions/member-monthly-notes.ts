"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { isStaffRole } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { memberMonthlyStaffNotes } from "@/lib/db/schema";
import { getMemberForStaffView } from "@/lib/queries/member-monthly-report";

const upsertSchema = z.object({
  memberId: z.string().uuid(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  body: z.string().max(32_000),
});

export async function upsertMemberMonthlyStaffNote(
  memberId: string,
  month: string,
  body: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user || !isStaffRole(session.user.role)) {
    return { ok: false, error: "Unauthorized" };
  }

  const parsed = upsertSchema.safeParse({ memberId, month, body });
  if (!parsed.success) {
    return { ok: false, error: "Invalid note data" };
  }

  const member = await getMemberForStaffView(parsed.data.memberId);
  if (!member) {
    return { ok: false, error: "You cannot edit notes for this member." };
  }

  const trimmed = parsed.data.body.trim();

  await db
    .insert(memberMonthlyStaffNotes)
    .values({
      memberId: parsed.data.memberId,
      month: parsed.data.month,
      body: trimmed,
      updatedBy: session.user.id,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [memberMonthlyStaffNotes.memberId, memberMonthlyStaffNotes.month],
      set: {
        body: trimmed,
        updatedBy: session.user.id,
        updatedAt: new Date(),
      },
    });

  revalidatePath("/dashboard/reports/monthly");
  return { ok: true };
}
