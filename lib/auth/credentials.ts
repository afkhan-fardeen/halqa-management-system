import bcrypt from "bcryptjs";
import { CredentialsSignin } from "next-auth";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { isDbConnectionError } from "@/lib/utils/pg-error";

/** Balance security vs latency (password reset, registration, login verify). */
const BCRYPT_ROUNDS = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

/**
 * Validates email/password and returns a NextAuth User, or null if invalid credentials.
 * Throws {@link CredentialsSignin} when the password matches but the account cannot sign in.
 */
export async function verifyCredentials(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  let row:
    | {
        id: string;
        email: string;
        passwordHash: string;
        name: string;
        role: (typeof users.$inferSelect)["role"];
        halqa: (typeof users.$inferSelect)["halqa"];
        genderUnit: (typeof users.$inferSelect)["genderUnit"];
        status: (typeof users.$inferSelect)["status"];
        language: (typeof users.$inferSelect)["language"];
        staffTag: (typeof users.$inferSelect)["staffTag"];
        scopeAllHalqas: (typeof users.$inferSelect)["scopeAllHalqas"];
        scopeGender: (typeof users.$inferSelect)["scopeGender"];
      }
    | undefined;

  try {
    [row] = await db
      .select({
        id: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
        name: users.name,
        role: users.role,
        halqa: users.halqa,
        genderUnit: users.genderUnit,
        status: users.status,
        language: users.language,
        staffTag: users.staffTag,
        scopeAllHalqas: users.scopeAllHalqas,
        scopeGender: users.scopeGender,
      })
      .from(users)
      .where(eq(users.email, normalized))
      .limit(1);
  } catch (e) {
    if (isDbConnectionError(e)) {
      const err = new CredentialsSignin();
      err.code = "database_unavailable";
      throw err;
    }
    throw e;
  }

  if (!row) return null;

  const match = await bcrypt.compare(password, row.passwordHash);
  if (!match) return null;

  if (row.status !== "ACTIVE") {
    const err = new CredentialsSignin();
    err.code = "inactive";
    throw err;
  }

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    halqa: row.halqa,
    genderUnit: row.genderUnit,
    language: row.language,
    status: row.status,
    staffTag: row.staffTag,
    scopeAllHalqas: row.scopeAllHalqas,
    scopeGender: row.scopeGender,
  };
}
