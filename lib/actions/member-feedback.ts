"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { memberFeedback } from "@/lib/db/schema";
import { memberFeedbackBodySchema } from "@/lib/validations/member-feedback";

export type MemberFeedbackActionState =
  | { error?: undefined; success: true }
  | { error: string; success?: false };

export async function submitMemberFeedback(
  _prev: MemberFeedbackActionState | null,
  formData: FormData,
): Promise<MemberFeedbackActionState> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "MEMBER") {
    return { error: "You must be signed in as a member to send feedback." };
  }
  if (session.user.status !== "ACTIVE") {
    return { error: "Your account must be active to send feedback." };
  }

  const parsed = memberFeedbackBodySchema.safeParse({
    message: formData.get("message"),
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first?.message ?? "Invalid feedback." };
  }

  await db.insert(memberFeedback).values({
    userId: session.user.id,
    message: parsed.data.message,
  });

  revalidatePath("/profile");
  revalidatePath("/dashboard/feedback");
  return { success: true };
}
