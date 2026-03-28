import type { DefaultSession } from "next-auth";
import type { Halqa } from "@/lib/constants/halqas";

export type UserRole = "MEMBER" | "SECRETARY" | "INCHARGE" | "ADMIN";
export type { Halqa };
export type GenderUnit = "MALE" | "FEMALE";
export type Language = "EN" | "UR";
export type UserStatus = "PENDING" | "ACTIVE" | "REJECTED" | "DEACTIVATED";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      halqa: Halqa;
      genderUnit: GenderUnit;
      language: Language;
      status: UserStatus;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    halqa: Halqa;
    genderUnit: GenderUnit;
    language: Language;
    status: UserStatus;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    halqa: Halqa;
    genderUnit: GenderUnit;
    language: Language;
    status: UserStatus;
  }
}
