/**
 * Seeds fixed demo staff accounts (ADMIN + Riffa INCHARGE, male).
 * Usage: npm run db:seed:staff
 *
 * Password for both (change in production): password123
 * Loads `.env.local` / `.env` for DATABASE_URL.
 */
import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const PASSWORD = "password123";

const seeds = [
  {
    email: "admin@qalbee.com",
    name: "Admin",
    phone: "00000000",
    role: "ADMIN" as const,
    halqa: "MANAMA" as const,
    genderUnit: "MALE" as const,
  },
  {
    email: "riffa.incharge@qalbee.com",
    name: "Riffa Incharge",
    phone: "00000001",
    role: "INCHARGE" as const,
    halqa: "RIFFA" as const,
    genderUnit: "MALE" as const,
  },
] as const;

async function main() {
  const { hashPassword } = await import("../lib/auth/credentials");
  const { db } = await import("../lib/db");
  const { users } = await import("../lib/db/schema");

  const passwordHash = await hashPassword(PASSWORD);

  for (const row of seeds) {
    const email = row.email.toLowerCase();
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      console.log("Skip (already exists):", email);
      continue;
    }

    await db.insert(users).values({
      name: row.name,
      email,
      passwordHash,
      phone: row.phone,
      role: row.role,
      halqa: row.halqa,
      genderUnit: row.genderUnit,
      status: "ACTIVE",
      language: "EN",
    });

    console.log("Created:", row.role, email, `(${row.halqa})`);
  }

  console.log("\nPassword for new accounts:", PASSWORD);
  console.log("Change passwords after first sign-in in production.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
