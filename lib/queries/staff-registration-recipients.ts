import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export type StaffRecipient = {
  id: string;
  email: string;
  name: string;
};

/**
 * Admins (all) + ACTIVE INCHARGE/SECRETARY for the same halqa and gender unit as the applicant.
 */
export async function getStaffRecipientsForNewRegistration(
  memberHalqa: (typeof users.$inferSelect)["halqa"],
  memberGender: (typeof users.$inferSelect)["genderUnit"],
): Promise<StaffRecipient[]> {
  const adminRows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
    })
    .from(users)
    .where(and(eq(users.role, "ADMIN"), eq(users.status, "ACTIVE")));

  const scopedRows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
    })
    .from(users)
    .where(
      and(
        eq(users.halqa, memberHalqa),
        eq(users.genderUnit, memberGender),
        inArray(users.role, ["INCHARGE", "SECRETARY"]),
        eq(users.status, "ACTIVE"),
      ),
    );

  const byId = new Map<string, StaffRecipient>();
  for (const r of [...adminRows, ...scopedRows]) {
    byId.set(r.id, r);
  }
  return [...byId.values()];
}
