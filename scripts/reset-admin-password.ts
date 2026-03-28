/**
 * Sets the password for the ADMIN user matching SEED_ADMIN_EMAIL (default admin@qalbee.com).
 *
 *   npm run db:reset-admin-password
 *
 * Defaults: admin@qalbee.com / password123 — override with SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD in `.env.local`.
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

  const [row] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!row) {
    console.error("No user found for", email, "— run npm run db:seed first.");
    process.exit(1);
  }
  if (row.role !== "ADMIN") {
    console.error("User exists but role is", row.role, "not ADMIN. Aborting.");
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, row.id));

  console.log("Password updated for ADMIN:", email);
  console.log("Sign in with that password, then change it in production.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
