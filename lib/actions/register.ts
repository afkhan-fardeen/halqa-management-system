"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/auth/credentials";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { notifyStaffOfPendingRegistration } from "@/lib/notifications/notify-staff-pending-registration";
import { isDbConnectionError } from "@/lib/utils/pg-error";
import { registerSchema } from "@/lib/validations/register";

export type RegisterState = { error?: string; success?: boolean };

export async function registerAction(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone"),
    halqa: formData.get("halqa"),
    genderUnit: formData.get("genderUnit"),
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first?.message ?? "Invalid input" };
  }

  const data = parsed.data;

  try {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, data.email.toLowerCase()))
      .limit(1);

    if (existing) {
      return { error: "An account with this email already exists" };
    }

    const [created] = await db
      .insert(users)
      .values({
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash: await hashPassword(data.password),
        phone: data.phone,
        role: "MEMBER",
        halqa: data.halqa,
        genderUnit: data.genderUnit,
        status: "PENDING",
        language: "EN",
      })
      .returning({
        name: users.name,
        halqa: users.halqa,
        genderUnit: users.genderUnit,
      });

    if (created) {
      await notifyStaffOfPendingRegistration({
        applicantName: created.name,
        halqa: created.halqa,
        genderUnit: created.genderUnit,
      }).catch((err) =>
        console.error("[register] notify staff pending registration:", err),
      );
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/registrations");
  } catch (e) {
    if (isDbConnectionError(e)) {
      return {
        error:
          "Cannot connect to the database. Start PostgreSQL and check DATABASE_URL in .env.local.",
      };
    }
    throw e;
  }

  return { success: true };
}
