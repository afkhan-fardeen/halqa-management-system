/**
 * Route protection via NextAuth `auth` (see auth.config.ts).
 * Use `proxy.ts` (not `middleware.ts`): Next.js 16 runs the **proxy** on the
 * **Node.js** runtime. `middleware.ts` runs on **Edge**, which cannot bundle
 * `@/auth` (DB, bcrypt, etc.) — Vercel will error: "unsupported modules: @/auth".
 */
export { auth as proxy } from "@/auth";

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
