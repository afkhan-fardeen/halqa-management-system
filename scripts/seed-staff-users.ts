/**
 * Seeds admin + all INCHARGE / SECRETARY pairs per halqa and gender unit.
 * Email pattern: {halqa}.{male|female}.{incharge|secretary}@qalbee.com
 *
 * Usage:
 *   npm run db:seed:staff              — uses DATABASE_URL (local)
 *   npm run db:seed:staff:neon         — uses DATABASE_URL_PRODUCTION (production / Neon)
 *
 * Password for seeded accounts (change after first sign-in in production): password123
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
const DOMAIN = "qalbee.com";
/** Always this email + PASSWORD for admin (password reset on seed if user already exists). */
const ADMIN_EMAIL = `admin@${DOMAIN}`.toLowerCase();

const HALQAS = [
  { halqa: "MANAMA" as const, slug: "manama" },
  { halqa: "RIFFA" as const, slug: "riffa" },
  { halqa: "MUHARRAQ" as const, slug: "muharraq" },
  { halqa: "UMM_AL_HASSAM" as const, slug: "umm_al_hassam" },
] as const;

function humanHalqaName(slug: string): string {
  if (slug === "umm_al_hassam") return "Umm Al Hassam";
  return slug
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

type SeedRow = {
  email: string;
  name: string;
  phone: string;
  role: "ADMIN" | "INCHARGE" | "SECRETARY";
  halqa: (typeof HALQAS)[number]["halqa"];
  genderUnit: "MALE" | "FEMALE";
};

function buildSeeds(): SeedRow[] {
  const rows: SeedRow[] = [
    {
      email: `admin@${DOMAIN}`,
      name: "Admin",
      phone: "00000000",
      role: "ADMIN",
      halqa: "MANAMA",
      genderUnit: "MALE",
    },
  ];

  let phoneSeq = 10_000_001;
  for (const { halqa, slug } of HALQAS) {
    const place = humanHalqaName(slug);
    for (const { genderUnit, unitSlug } of [
      { genderUnit: "MALE" as const, unitSlug: "male" },
      { genderUnit: "FEMALE" as const, unitSlug: "female" },
    ]) {
      for (const { role, roleSlug } of [
        { role: "INCHARGE" as const, roleSlug: "incharge" },
        { role: "SECRETARY" as const, roleSlug: "secretary" },
      ]) {
        rows.push({
          email: `${slug}.${unitSlug}.${roleSlug}@${DOMAIN}`,
          name: `${place} ${unitSlug === "male" ? "Male" : "Female"} ${
            roleSlug === "incharge" ? "Incharge" : "Secretary"
          }`,
          phone: String(phoneSeq++),
          role,
          halqa,
          genderUnit,
        });
      }
    }
  }
  return rows;
}

const seeds = buildSeeds();

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
      if (email === ADMIN_EMAIL && row.role === "ADMIN") {
        await db
          .update(users)
          .set({ passwordHash, updatedAt: new Date() })
          .where(eq(users.id, existing.id));
        console.log("Updated password for ADMIN:", email);
        continue;
      }
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

    console.log("Created:", row.role, email, `(${row.halqa} ${row.genderUnit})`);
  }

  console.log("\nAdmin:", ADMIN_EMAIL, "— password:", PASSWORD, "(reset on each staff seed if admin exists).");
  console.log("Password for other newly created accounts:", PASSWORD);
  console.log("Change passwords after first sign-in in production.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
