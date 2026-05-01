/**
 * Inserts demo staff (admin, incharge, secretary), members, daily logs, contacts,
 * aiyanat, notifications, and refreshes unit stats.
 * Safe to run multiple times — skips rows that already exist (by email).
 *
 * Usage: npm run db:seed:demo
 *
 * Env (optional):
 *   SEED_DEMO_PASSWORD=Demo1234
 */
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

async function main() {
  const bcrypt = await import("bcryptjs");
  const { and, eq } = await import("drizzle-orm");
  const { db } = await import("../lib/db");
  const {
    users,
    dailyLogs,
    contacts,
    aiyanat,
    notifications,
  } = await import("../lib/db/schema");
  const { refreshDailyUnitStats } = await import(
    "../lib/db/refresh-daily-unit-stats"
  );
  const { parseYmdToUtcDate, todayYmdLocal } = await import(
    "../lib/utils/date"
  );

  const password = process.env.SEED_DEMO_PASSWORD ?? "Demo1234";
  const passwordHash = await bcrypt.default.hash(password, 12);

  const staffUsers = [
    {
      name: "Demo Admin",
      email: "demo.admin@example.com",
      role: "ADMIN" as const,
      halqa: "MANAMA" as const,
      genderUnit: "MALE" as const,
    },
    {
      name: "Demo Incharge",
      email: "demo.incharge@example.com",
      role: "INCHARGE" as const,
      halqa: "MANAMA" as const,
      genderUnit: "MALE" as const,
    },
    {
      name: "Demo Secretary",
      email: "demo.secretary@example.com",
      role: "SECRETARY" as const,
      halqa: "MANAMA" as const,
      genderUnit: "MALE" as const,
    },
    {
      name: "Demo Incharge (female unit)",
      email: "demo.incharge.female@example.com",
      role: "INCHARGE" as const,
      halqa: "MANAMA" as const,
      genderUnit: "FEMALE" as const,
    },
    {
      name: "Demo Secretary (female unit)",
      email: "demo.secretary.female@example.com",
      role: "SECRETARY" as const,
      halqa: "MANAMA" as const,
      genderUnit: "FEMALE" as const,
    },
  ] as const;

  for (const s of staffUsers) {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, s.email))
      .limit(1);

    if (existing) {
      console.log("Exists (staff):", s.email, "→", existing.id);
      continue;
    }

    await db.insert(users).values({
      name: s.name,
      email: s.email,
      passwordHash,
      phone: "12345678",
      role: s.role,
      halqa: s.halqa,
      genderUnit: s.genderUnit,
      status: "ACTIVE",
      language: "EN",
    });
    console.log("Created staff:", s.role, s.email);
  }

  const demoUsers = [
    {
      name: "Ahmed Khan",
      email: "demo.member@example.com",
      halqa: "MANAMA" as const,
      genderUnit: "MALE" as const,
    },
    {
      name: "Fatima Ali",
      email: "demo.member2@example.com",
      halqa: "MANAMA" as const,
      genderUnit: "FEMALE" as const,
    },
  ] as const;

  for (const u of demoUsers) {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, u.email))
      .limit(1);

    if (existing) {
      console.log("Exists:", u.email, "→", existing.id);
      continue;
    }

    const [row] = await db
      .insert(users)
      .values({
        name: u.name,
        email: u.email,
        passwordHash,
        phone: "12345678",
        role: "MEMBER",
        halqa: u.halqa,
        genderUnit: u.genderUnit,
        status: "ACTIVE",
        language: "EN",
      })
      .returning({ id: users.id });

    if (row) {
      console.log("Created member:", u.email, "→", row.id);
    }
  }

  const [primary] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, demoUsers[0].email))
    .limit(1);

  if (!primary) {
    console.error("No primary demo user; abort.");
    process.exit(1);
  }

  const userId = primary.id;

  const ymd = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const dates = [ymd(0), ymd(1), ymd(2)];
  const malePrayers = {
    fajr: "BA_JAMAAT" as const,
    dhuhr: "BA_JAMAAT" as const,
    asr: "MUNFARID" as const,
    maghrib: "BA_JAMAAT" as const,
    isha: "QAZA" as const,
  };

  for (const dateStr of dates) {
    const logDate = parseYmdToUtcDate(dateStr);
    const [hasLog] = await db
      .select({ id: dailyLogs.id })
      .from(dailyLogs)
      .where(and(eq(dailyLogs.userId, userId), eq(dailyLogs.date, logDate)))
      .limit(1);

    if (hasLog) {
      console.log("Daily log exists:", dateStr);
      continue;
    }

    await db.insert(dailyLogs).values({
      id: crypto.randomUUID(),
      userId,
      date: logDate,
      ...malePrayers,
      quranType: "TILAWAT",
      quranSurah: "Al-Baqarah",
      quranPages: 2 + (dateStr === dates[0] ? 1 : 0),
      hadith: true,
      literature: true,
      salatSaved: true,
      quranSaved: true,
      hadithSaved: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log("Inserted daily log:", dateStr);
  }

  const [femaleUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, demoUsers[1].email))
    .limit(1);

  if (femaleUser) {
    const femaleDay = ymd(1);
    const fd = parseYmdToUtcDate(femaleDay);
    const [fLog] = await db
      .select({ id: dailyLogs.id })
      .from(dailyLogs)
      .where(
        and(eq(dailyLogs.userId, femaleUser.id), eq(dailyLogs.date, fd)),
      )
      .limit(1);
    if (!fLog) {
      await db.insert(dailyLogs).values({
        id: crypto.randomUUID(),
        userId: femaleUser.id,
        date: fd,
        fajr: "ON_TIME",
        dhuhr: "ON_TIME",
        asr: "ON_TIME",
        maghrib: "ON_TIME",
        isha: "QAZA",
        quranType: "TAFSEER",
        quranSurah: "Al-Mulk",
        quranPages: 1,
        hadith: true,
        literature: false,
        salatSaved: true,
        quranSaved: true,
        hadithSaved: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log("Inserted female member daily log:", femaleDay);
    }
  }

  // Contacts on most recent log date
  const todayStr = todayYmdLocal();
  const logDate = parseYmdToUtcDate(todayStr);
  const [contactExists] = await db
    .select({ id: contacts.id })
    .from(contacts)
    .where(and(eq(contacts.userId, userId), eq(contacts.logDate, logDate)))
    .limit(1);

  if (!contactExists) {
    await db.insert(contacts).values([
      {
        id: crypto.randomUUID(),
        userId,
        logDate,
        name: "Yusuf Rahman",
        phone: "97333111222",
        location: "Manama",
        status: "MUSLIM",
        createdAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        userId,
        logDate,
        name: "Visitor (stall)",
        phone: "97300000000",
        location: "Souq",
        status: "NON_MUSLIM",
        createdAt: new Date(),
      },
    ]);
    console.log("Inserted contacts for", todayStr);
  }

  // Aiyanat current month
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [hasAiy] = await db
    .select({ id: aiyanat.id })
    .from(aiyanat)
    .where(and(eq(aiyanat.userId, userId), eq(aiyanat.month, monthStr)))
    .limit(1);

  if (!hasAiy) {
    await db.insert(aiyanat).values({
      id: crypto.randomUUID(),
      userId,
      month: monthStr,
      amount: "25.00",
      status: "PAID",
      paymentDate: logDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log("Inserted Aiyanat for", monthStr);
  }

  const [hasNotif] = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.type, "demo_welcome"),
      ),
    )
    .limit(1);

  if (!hasNotif) {
    await db.insert(notifications).values({
      id: crypto.randomUUID(),
      userId,
      type: "demo_welcome",
      message:
        "Welcome to the demo. Sign in as demo.member@example.com with your demo password.",
      read: false,
      createdAt: new Date(),
    });
    console.log("Inserted welcome notification");
  }

  // Refresh stats for each date we touched
  const halqa = "MANAMA";
  for (const dateStr of dates) {
    const d = parseYmdToUtcDate(dateStr);
    await db.transaction(async (tx) => {
      await refreshDailyUnitStats(tx, d, halqa, "MALE");
    });
  }
  const femaleDayStr = ymd(1);
  await db.transaction(async (tx) => {
    await refreshDailyUnitStats(
      tx,
      parseYmdToUtcDate(femaleDayStr),
      halqa,
      "FEMALE",
    );
  });

  console.log("\n--- Staff (dashboard) — same password for all demo accounts ---");
  for (const s of staffUsers) {
    console.log(`  ${s.role.padEnd(10)} ${s.email} / ${password}`);
  }
  console.log("\n--- Members ---");
  console.log("  ", demoUsers[0].email, "/", password);
  console.log("  ", demoUsers[1].email, "/", password);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
