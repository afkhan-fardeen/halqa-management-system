"use server";

import { and, eq, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { isStaffRole } from "@/lib/auth/roles";
import { NOTIFICATION_TYPES } from "@/lib/constants/notification-types";
import { insertNotification } from "@/lib/db/insert-notification";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { HALQA_VALUES } from "@/lib/constants/halqas";
import type { Halqa } from "@/lib/constants/halqas";
import { z } from "zod";

const GENDER_UNITS = ["MALE", "FEMALE"] as const;

const MESSAGE_MAX = 4000;
const MAX_RECIPIENTS = 2000;
const MIN_MS_BETWEEN_SENDS = 60_000;

const lastSendByStaff = new Map<string, number>();

const filterSchema = z.object({
  halqa: z.enum(HALQA_VALUES).optional(),
  genderUnit: z.enum(GENDER_UNITS).optional(),
});

function buildMemberScope(args: {
  role: string;
  sessionHalqa: string;
  sessionGenderUnit: string;
  filterHalqa?: string;
  filterGenderUnit?: string;
}) {
  const activeMember = and(eq(users.role, "MEMBER"), eq(users.status, "ACTIVE"));

  if (args.role === "ADMIN") {
    const f = filterSchema.safeParse({
      halqa: args.filterHalqa || undefined,
      genderUnit: args.filterGenderUnit || undefined,
    });
    if (!f.success) {
      return { error: "Invalid filter" as const, where: null };
    }
    const h = f.data.halqa;
    const g = f.data.genderUnit;
    if (h && g) {
      return {
        error: null,
        where: and(activeMember, eq(users.halqa, h), eq(users.genderUnit, g)),
      };
    }
    if (h) {
      return { error: null, where: and(activeMember, eq(users.halqa, h)) };
    }
    if (g) {
      return {
        error: null,
        where: and(activeMember, eq(users.genderUnit, g)),
      };
    }
    return { error: null, where: activeMember };
  }

  return {
    error: null,
    where: and(
      activeMember,
      eq(users.halqa, args.sessionHalqa as Halqa),
      eq(users.genderUnit, args.sessionGenderUnit as (typeof GENDER_UNITS)[number]),
    ),
  };
}

export type StaffAnnouncementState =
  | { ok: true; sent: number }
  | { ok: false; error: string };

const messageSchema = z
  .string()
  .trim()
  .min(1, "Message is required")
  .max(MESSAGE_MAX, `Message must be at most ${MESSAGE_MAX} characters`);

export async function getStaffAnnouncementRecipientCount(options: {
  halqa?: string;
  genderUnit?: string;
}): Promise<{ count: number } | { error: string }> {
  const session = await auth();
  if (!session?.user || !isStaffRole(session.user.role)) {
    return { error: "Unauthorized" };
  }

  const scope = buildMemberScope({
    role: session.user.role,
    sessionHalqa: session.user.halqa,
    sessionGenderUnit: session.user.genderUnit,
    filterHalqa: session.user.role === "ADMIN" ? options.halqa : undefined,
    filterGenderUnit: session.user.role === "ADMIN" ? options.genderUnit : undefined,
  });

  if (scope.error || !scope.where) {
    return { error: scope.error ?? "Invalid scope" };
  }

  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(users)
    .where(scope.where);

  return { count: row?.n ?? 0 };
}

export async function sendStaffAnnouncements(
  _prev: StaffAnnouncementState | null,
  formData: FormData,
): Promise<StaffAnnouncementState> {
  const session = await auth();
  if (!session?.user || !isStaffRole(session.user.role)) {
    return { ok: false, error: "Unauthorized" };
  }

  const staffId = session.user.id!;
  const now = Date.now();
  const last = lastSendByStaff.get(staffId);
  if (last !== undefined && now - last < MIN_MS_BETWEEN_SENDS) {
    return {
      ok: false,
      error: "Please wait a minute before sending another announcement.",
    };
  }

  const rawMessage = String(formData.get("message") ?? "");
  const parsedMsg = messageSchema.safeParse(rawMessage);
  if (!parsedMsg.success) {
    return { ok: false, error: parsedMsg.error.issues[0]?.message ?? "Invalid message" };
  }

  const filterHalqa =
    session.user.role === "ADMIN"
      ? String(formData.get("halqa") ?? "").trim() || undefined
      : undefined;
  const filterGenderUnit =
    session.user.role === "ADMIN"
      ? String(formData.get("genderUnit") ?? "").trim() || undefined
      : undefined;

  const scope = buildMemberScope({
    role: session.user.role,
    sessionHalqa: session.user.halqa,
    sessionGenderUnit: session.user.genderUnit,
    filterHalqa,
    filterGenderUnit,
  });

  if (scope.error || !scope.where) {
    return { ok: false, error: scope.error ?? "Invalid scope" };
  }

  const recipients = await db
    .select({ id: users.id })
    .from(users)
    .where(scope.where);

  if (recipients.length > MAX_RECIPIENTS) {
    return {
      ok: false,
      error: `Too many recipients (${recipients.length}). Maximum is ${MAX_RECIPIENTS}. Narrow filters or contact support.`,
    };
  }

  const body =
    session.user.role === "ADMIN"
      ? parsedMsg.data
      : `[From your halqa team] ${parsedMsg.data}`;

  for (const r of recipients) {
    await insertNotification({
      userId: r.id,
      type: NOTIFICATION_TYPES.STAFF_ANNOUNCEMENT,
      message: body,
    });
  }

  lastSendByStaff.set(staffId, now);

  return { ok: true, sent: recipients.length };
}
