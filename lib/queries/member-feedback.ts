import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { memberFeedback, users } from "@/lib/db/schema";

export type MemberFeedbackRow = {
  id: string;
  message: string;
  createdAt: Date;
  memberName: string;
  memberEmail: string;
  halqa: string;
  genderUnit: string;
};

export async function listMemberFeedbackForAdmin(): Promise<MemberFeedbackRow[]> {
  const rows = await db
    .select({
      id: memberFeedback.id,
      message: memberFeedback.message,
      createdAt: memberFeedback.createdAt,
      memberName: users.name,
      memberEmail: users.email,
      halqa: users.halqa,
      genderUnit: users.genderUnit,
    })
    .from(memberFeedback)
    .innerJoin(users, eq(memberFeedback.userId, users.id))
    .orderBy(desc(memberFeedback.createdAt));

  return rows;
}
