/**
 * Central helper for building Drizzle WHERE conditions that scope data access
 * for staff users (ADMIN, INCHARGE, SECRETARY).
 *
 * Rules:
 *   scopeAllHalqas = true   → no halqa filter (all halqas visible)
 *   scopeAllHalqas = false  → filter to the user's own halqa
 *
 *   scopeGender = "BOTH"    → no gender filter
 *   scopeGender = "MALE"    → only MALE members
 *   scopeGender = "FEMALE"  → only FEMALE members
 *   scopeGender = null      → fall back to the user's own genderUnit
 *
 * Existing ADMIN accounts have scopeAllHalqas=true + scopeGender="BOTH" (set by
 * migration), so their behaviour is unchanged.
 * Existing INCHARGE/SECRETARY accounts have scopeAllHalqas=false + scopeGender=null
 * (DB defaults), so they continue to see only their own halqa+genderUnit.
 */

import { and, eq } from "drizzle-orm";
import type { ScopeGender } from "@/types/next-auth";
import type { Halqa } from "@/lib/constants/halqas";
import { users } from "@/lib/db/schema";

type StaffScopeUser = {
  halqa: Halqa;
  genderUnit: "MALE" | "FEMALE";
  scopeAllHalqas: boolean;
  scopeGender: ScopeGender;
};

/**
 * Returns a Drizzle SQL condition that restricts to members visible to this
 * staff user.  Always includes `role = 'MEMBER'` as a base constraint.
 */
export function buildStaffMemberScope(user: StaffScopeUser) {
  const halqaConstraint = user.scopeAllHalqas
    ? undefined
    : eq(users.halqa, user.halqa);

  const effectiveGender = user.scopeGender ?? user.genderUnit;
  const genderConstraint =
    effectiveGender === "BOTH"
      ? undefined
      : eq(users.genderUnit, effectiveGender as "MALE" | "FEMALE");

  return and(eq(users.role, "MEMBER"), halqaConstraint, genderConstraint);
}

/**
 * Returns a Drizzle SQL condition scoped to the attendance programs (or any
 * halqa+genderUnit table) visible to this staff user.
 *
 * halqaCol / genderCol must be the Drizzle column references for the target table.
 */
export function buildStaffHalqaGenderScope(
  user: StaffScopeUser,
  halqaCol: Parameters<typeof eq>[0],
  genderCol: Parameters<typeof eq>[0],
) {
  const halqaConstraint = user.scopeAllHalqas
    ? undefined
    : eq(halqaCol, user.halqa);

  const effectiveGender = user.scopeGender ?? user.genderUnit;
  const genderConstraint =
    effectiveGender === "BOTH"
      ? undefined
      : eq(genderCol, effectiveGender as "MALE" | "FEMALE");

  return and(halqaConstraint, genderConstraint) ?? undefined;
}

/**
 * Returns true when the given halqa + genderUnit is within this staff user's
 * allowed scope.  Used in write-gate checks ("can this user manage *this* member?").
 */
export function isInStaffScope(
  user: StaffScopeUser,
  targetHalqa: string,
  targetGenderUnit: string,
): boolean {
  if (!user.scopeAllHalqas && targetHalqa !== user.halqa) {
    return false;
  }
  const effectiveGender = user.scopeGender ?? user.genderUnit;
  if (effectiveGender !== "BOTH" && targetGenderUnit !== effectiveGender) {
    return false;
  }
  return true;
}

/**
 * Returns true when the staff user has super-admin capabilities:
 * can see all halqas AND all genders.  Used to gate the staff user management UI.
 */
export function isSuperAdmin(user: StaffScopeUser): boolean {
  return user.scopeAllHalqas && user.scopeGender === "BOTH";
}
