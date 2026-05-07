"use server";

import { revalidatePath } from "next/cache";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { isStaffRole } from "@/lib/auth/roles";
import { isSuperAdmin } from "@/lib/auth/staff-scope";
import { hashPassword } from "@/lib/auth/credentials";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { HALQA_VALUES } from "@/lib/constants/halqas";

const GENDER_UNITS = ["MALE", "FEMALE"] as const;
const STAFF_ROLES = ["ADMIN", "INCHARGE", "SECRETARY"] as const;
const SCOPE_GENDERS = ["MALE", "FEMALE", "BOTH"] as const;

const createStaffUserSchema = z.object({
  email: z.string().trim().email("Valid email required").toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  name: z.string().trim().min(1, "Name is required").max(255),
  phone: z.string().trim().min(1, "Phone is required").max(20),
  role: z.enum(STAFF_ROLES),
  halqa: z.enum(HALQA_VALUES),
  genderUnit: z.enum(GENDER_UNITS),
  staffTag: z.string().trim().max(100).optional(),
  scopeAllHalqas: z.boolean().default(false),
  scopeGender: z.enum(SCOPE_GENDERS).nullable().default(null),
});

const editStaffUserSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  name: z.string().trim().min(1, "Name is required").max(255),
  phone: z.string().trim().min(1, "Phone is required").max(20),
  role: z.enum(STAFF_ROLES),
  halqa: z.enum(HALQA_VALUES),
  genderUnit: z.enum(GENDER_UNITS),
  staffTag: z.string().trim().max(100).optional(),
  scopeAllHalqas: z.boolean().default(false),
  scopeGender: z.enum(SCOPE_GENDERS).nullable().default(null),
  /** If provided and non-empty, updates the password. */
  newPassword: z.string().max(128).optional(),
});

export type StaffUserActionState =
  | { ok: true; userId: string }
  | { ok: false; error: string };

async function assertSuperAdmin() {
  const session = await auth();
  if (!session?.user || !isStaffRole(session.user.role)) {
    return { ok: false as const, error: "Unauthorized" };
  }
  if (!isSuperAdmin(session.user)) {
    return { ok: false as const, error: "Only super admins can manage staff users" };
  }
  return { ok: true as const, session };
}

export async function createStaffUser(
  _prev: StaffUserActionState | null,
  formData: FormData,
): Promise<StaffUserActionState> {
  const gate = await assertSuperAdmin();
  if (!gate.ok) return { ok: false, error: gate.error };

  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
    phone: formData.get("phone"),
    role: formData.get("role"),
    halqa: formData.get("halqa"),
    genderUnit: formData.get("genderUnit"),
    staffTag: formData.get("staffTag") || undefined,
    scopeAllHalqas: formData.get("scopeAllHalqas") === "true",
    scopeGender: formData.get("scopeGender") || null,
  };

  const parsed = createStaffUserSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const {
    email,
    password,
    name,
    phone,
    role,
    halqa,
    genderUnit,
    staffTag,
    scopeAllHalqas,
    scopeGender,
  } = parsed.data;

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    return { ok: false, error: "A user with this email already exists" };
  }

  const passwordHash = await hashPassword(password);

  const [row] = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      name,
      phone,
      role,
      halqa,
      genderUnit,
      status: "ACTIVE",
      language: "EN",
      staffTag: staffTag ?? null,
      scopeAllHalqas,
      scopeGender,
    })
    .returning({ id: users.id });

  if (!row) {
    return { ok: false, error: "Failed to create user" };
  }

  revalidatePath("/dashboard/users");
  return { ok: true, userId: row.id };
}

export async function editStaffUser(
  _prev: StaffUserActionState | null,
  formData: FormData,
): Promise<StaffUserActionState> {
  const gate = await assertSuperAdmin();
  if (!gate.ok) return { ok: false, error: gate.error };

  const raw = {
    userId: formData.get("userId"),
    name: formData.get("name"),
    phone: formData.get("phone"),
    role: formData.get("role"),
    halqa: formData.get("halqa"),
    genderUnit: formData.get("genderUnit"),
    staffTag: formData.get("staffTag") || undefined,
    scopeAllHalqas: formData.get("scopeAllHalqas") === "true",
    scopeGender: formData.get("scopeGender") || null,
    newPassword: String(formData.get("newPassword") ?? "").trim() || undefined,
  };

  const parsed = editStaffUserSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const {
    userId,
    name,
    phone,
    role,
    halqa,
    genderUnit,
    staffTag,
    scopeAllHalqas,
    scopeGender,
    newPassword,
  } = parsed.data;

  const [target] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!target) {
    return { ok: false, error: "User not found" };
  }
  if (!isStaffRole(target.role)) {
    return { ok: false, error: "Only staff users can be edited here" };
  }

  const updateData: Record<string, unknown> = {
    name,
    phone,
    role,
    halqa,
    genderUnit,
    staffTag: staffTag ?? null,
    scopeAllHalqas,
    scopeGender,
    updatedAt: new Date(),
  };

  if (newPassword) {
    if (newPassword.length < 8) {
      return { ok: false, error: "Password must be at least 8 characters" };
    }
    updateData.passwordHash = await hashPassword(newPassword);
  }

  await db.update(users).set(updateData).where(eq(users.id, userId));

  revalidatePath("/dashboard/users");
  return { ok: true, userId };
}

export type StaffUserRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  halqa: string;
  genderUnit: string;
  staffTag: string | null;
  scopeAllHalqas: boolean;
  scopeGender: string | null;
  status: string;
  createdAt: Date;
};

export async function listStaffUsers(): Promise<StaffUserRow[]> {
  const gate = await assertSuperAdmin();
  if (!gate.ok) return [];

  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      halqa: users.halqa,
      genderUnit: users.genderUnit,
      staffTag: users.staffTag,
      scopeAllHalqas: users.scopeAllHalqas,
      scopeGender: users.scopeGender,
      status: users.status,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(inArray(users.role, ["ADMIN", "INCHARGE", "SECRETARY"]))
    .orderBy(users.role, users.createdAt);
}
