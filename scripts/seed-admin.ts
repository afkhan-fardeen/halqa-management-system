/**
 * Creates a single ACTIVE ADMIN user if the email does not exist.
 * Usage: npm run db:seed
 *
 * Loads `.env.local` before any module that reads `DATABASE_URL`.
 */
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

async function main() {
  const { eq } = await import("drizzle-orm");
  const { hashPassword } = await import("../lib/auth/credentials");
  const { db } = await import("../lib/db");
  const { users } = await import("../lib/db/schema");

  const email = (
    process.env.SEED_ADMIN_EMAIL ?? "admin@qalbee.com"
  ).toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "password123";

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    console.log("Seed skipped: user already exists for", email);
    console.log(
      "If you can’t sign in, run: npm run db:reset-admin-password",
    );
    process.exit(0);
  }

  const passwordHash = await hashPassword(password);

  await db.insert(users).values({
    name: "System Admin",
    email,
    passwordHash,
    phone: "00000000",
    role: "ADMIN",
    halqa: "MANAMA",
    genderUnit: "MALE",
    status: "ACTIVE",
    language: "EN",
  });

  console.log("Created admin user:", email);
  console.log("Sign in with this password once, then change it in production.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
