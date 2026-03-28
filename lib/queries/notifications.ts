import { and, desc, eq, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";

export async function listNotificationsForCurrentUser() {
  const session = await auth();
  if (!session?.user) {
    return [];
  }
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, session.user.id))
    .orderBy(desc(notifications.createdAt));
}

export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const session = await auth();
    if (!session?.user) {
      return 0;
    }
    const [row] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(notifications)
      .where(
        and(eq(notifications.userId, session.user.id), eq(notifications.read, false)),
      );
    return row?.n ?? 0;
  } catch {
    return 0;
  }
}
