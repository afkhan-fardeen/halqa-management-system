/**
 * Seeds fixed demo staff accounts (ADMIN + Riffa INCHARGE, male).
 * Usage:
 *   npm run db:seed:staff              — uses DATABASE_URL (local Docker)
 *   npm run db:seed:staff:neon         — uses DATABASE_URL_PRODUCTION (Neon)
 *
 * Password for both (change in production): password123
 * Loads `.env.local` / `.env` for DATABASE_URL / DATABASE_URL_PRODUCTION.
 */
import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const useProduction =
  process.env.SEED_USE_PRODUCTION === "1" ||
  process.env.MIGRATE_USE_PRODUCTION === "1";
if (useProduction) {
  const prod = process.env.DATABASE_URL_PRODUCTION?.trim();
  if (!prod) {
    console.error("DATABASE_URL_PRODUCTION is not set (needed for Neon seed).");
    process.exit(1);
  }
  process.env.DATABASE_URL = prod;
  console.log("[seed:staff] Using DATABASE_URL_PRODUCTION (Neon / production).");
}

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
